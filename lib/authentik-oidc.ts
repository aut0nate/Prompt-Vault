import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const OAUTH_STATE_COOKIE_NAME = "prompt-vault-oauth-state";

const encoder = new TextEncoder();
const oauthStateMaxAgeSeconds = 60 * 10;

type DiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

type OAuthState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  nextPath: string;
  expiresAt: number;
};

type TokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

type AuthentikJsonWebKey = JsonWebKey & {
  kid?: string;
};

type JwksDocument = {
  keys?: AuthentikJsonWebKey[];
};

type IdTokenPayload = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  nonce?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "") || "http";
  const browserHost = host.replace(/^0\.0\.0\.0(?=[:/]|$)/, "localhost");

  return `${protocol}://${browserHost}`;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing. Add it to your .env file.`);
  }

  return value;
}

function getIssuer() {
  return getRequiredEnv("AUTHENTIK_ISSUER").replace(/\/+$/, "");
}

export function getRedirectUri(request: NextRequest) {
  const configuredRedirectUri = process.env.AUTHENTIK_REDIRECT_URI?.trim();

  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  return `${getAppUrl(request)}/auth/callback`;
}

export function getAppUrl(request: NextRequest) {
  const configuredAppUrl = process.env.APP_URL?.trim() || process.env.APP_ORIGIN?.trim();

  if (configuredAppUrl) {
    return trimTrailingSlash(configuredAppUrl);
  }

  return getRequestOrigin(request);
}

export function safeNextPath(value: string | null) {
  const nextPath = value || "/admin";

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

export function buildLoginUrl(request: NextRequest, error?: string, nextPath = "/admin") {
  const loginUrl = new URL("/login", getAppUrl(request));

  if (error) {
    loginUrl.searchParams.set("error", error);
  }

  loginUrl.searchParams.set("next", safeNextPath(nextPath));

  return loginUrl;
}

export function buildCookieOptions(path: string, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path,
    maxAge,
  };
}

function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", buildCookieOptions("/auth", 0));
}

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

function randomBase64Url(bytes = 32) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);

  return bytesToBase64Url(values);
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));

  return bytesToBase64Url(new Uint8Array(digest));
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getRequiredEnv("SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signValue(value: string) {
  const signingKey = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

async function encodeOAuthState(payload: OAuthState) {
  const encodedPayload = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));

  return `${encodedPayload}.${await signValue(encodedPayload)}`;
}

export async function decodeOAuthState(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const signingKey = await getSigningKey();
  const isValid = await crypto.subtle.verify(
    "HMAC",
    signingKey,
    base64UrlToBytes(encodedSignature),
    encoder.encode(encodedPayload),
  );

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as OAuthState;

    if (!payload.state || !payload.nonce || !payload.codeVerifier || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function fetchDiscovery() {
  const issuer = getIssuer();
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Authentik discovery could not be loaded.");
  }

  const discovery = (await response.json()) as DiscoveryDocument;

  if (!discovery.authorization_endpoint || !discovery.token_endpoint || !discovery.jwks_uri) {
    throw new Error("Authentik discovery is missing required OIDC endpoints.");
  }

  return discovery;
}

export async function createLoginResponse(request: NextRequest) {
  const discovery = await fetchDiscovery();
  const codeVerifier = randomBase64Url(64);
  const statePayload: OAuthState = {
    state: randomBase64Url(),
    nonce: randomBase64Url(),
    codeVerifier,
    nextPath: safeNextPath(request.nextUrl.searchParams.get("next")),
    expiresAt: Date.now() + oauthStateMaxAgeSeconds * 1000,
  };
  const authorizeUrl = new URL(discovery.authorization_endpoint);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", getRequiredEnv("AUTHENTIK_CLIENT_ID"));
  authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(request));
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", statePayload.state);
  authorizeUrl.searchParams.set("nonce", statePayload.nonce);
  authorizeUrl.searchParams.set("code_challenge", await sha256Base64Url(codeVerifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    await encodeOAuthState(statePayload),
    buildCookieOptions("/auth", oauthStateMaxAgeSeconds),
  );

  return response;
}

async function exchangeCode(request: NextRequest, code: string, state: OAuthState, discovery: DiscoveryDocument) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(request),
    client_id: getRequiredEnv("AUTHENTIK_CLIENT_ID"),
    client_secret: getRequiredEnv("AUTHENTIK_CLIENT_SECRET"),
    code_verifier: state.codeVerifier,
  });
  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const tokenResponse = (await response.json()) as TokenResponse;

  if (!response.ok || !tokenResponse.id_token) {
    throw new Error(tokenResponse.error_description || tokenResponse.error || "Authentik token exchange failed.");
  }

  return tokenResponse.id_token;
}

async function verifyJwtSignature(idToken: string, jwksUri: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Authentik returned a malformed ID token.");
  }

  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as {
    alg?: string;
    kid?: string;
  };

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Authentik ID token must be signed with RS256.");
  }

  const response = await fetch(jwksUri, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Authentik signing keys could not be loaded.");
  }

  const jwks = (await response.json()) as JwksDocument;
  const key = jwks.keys?.find((candidate) => candidate.kid === header.kid);

  if (!key) {
    throw new Error("Authentik signing key was not found.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlToBytes(encodedSignature),
    encoder.encode(signingInput),
  );

  if (!isValid) {
    throw new Error("Authentik ID token signature is invalid.");
  }

  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as IdTokenPayload;
}

function validateIdTokenClaims(payload: IdTokenPayload, discovery: DiscoveryDocument, state: OAuthState) {
  const now = Math.floor(Date.now() / 1000);
  const clientId = getRequiredEnv("AUTHENTIK_CLIENT_ID");
  const allowedEmail = getRequiredEnv("AUTHENTIK_ADMIN_EMAIL").toLowerCase();
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

  if (payload.iss !== discovery.issuer) {
    throw new Error("Authentik ID token issuer is invalid.");
  }

  if (!audience.includes(clientId)) {
    throw new Error("Authentik ID token audience is invalid.");
  }

  if (!payload.exp || payload.exp <= now) {
    throw new Error("Authentik ID token has expired.");
  }

  if (payload.nbf && payload.nbf > now) {
    throw new Error("Authentik ID token is not valid yet.");
  }

  if (payload.nonce !== state.nonce) {
    throw new Error("Authentik ID token nonce is invalid.");
  }

  if (!payload.sub) {
    throw new Error("Authentik ID token is missing a subject.");
  }

  if (!payload.email || payload.email.toLowerCase() !== allowedEmail) {
    throw new Error("This Authentik user is not allowed to manage Prompt Vault.");
  }

  return {
    email: payload.email,
    subject: payload.sub,
  };
}

export async function createCallbackResponse(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const incomingState = request.nextUrl.searchParams.get("state");
  const storedState = await decodeOAuthState(request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value);

  if (!code || !incomingState || !storedState || incomingState !== storedState.state) {
    const response = NextResponse.redirect(buildLoginUrl(request, "invalid_state"));
    clearOAuthStateCookie(response);
    return response;
  }

  try {
    const discovery = await fetchDiscovery();
    const idToken = await exchangeCode(request, code, storedState, discovery);
    const claims = validateIdTokenClaims(await verifyJwtSignature(idToken, discovery.jwks_uri), discovery, storedState);
    const sessionToken = await createSessionToken(claims.email);
    const response = NextResponse.redirect(new URL(storedState.nextPath, getAppUrl(request)));

    clearOAuthStateCookie(response);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, buildCookieOptions("/", 60 * 60 * 24 * 14));

    return response;
  } catch {
    const response = NextResponse.redirect(buildLoginUrl(request, "auth_failed", storedState.nextPath));
    clearOAuthStateCookie(response);
    return response;
  }
}
