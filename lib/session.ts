export const SESSION_COOKIE_NAME = "prompt-vault-session";

const encoder = new TextEncoder();
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing. Add it to your .env file.");
  }

  return encoder.encode(secret);
}

async function getSigningKey() {
  return crypto.subtle.importKey("raw", getSessionSecret(), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function bytesToBase64Url(bytes: Uint8Array) {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(String.fromCharCode(...bytes));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function createSessionToken(username: string) {
  const payload: SessionPayload = {
    sub: username,
    exp: Date.now() + sessionLifetimeMs,
  };

  const encodedPayload = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingKey = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(encodedPayload));

  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string) {
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
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as SessionPayload;

    if (!payload.sub || payload.exp < Date.now()) {
      return null;
    }

    return { username: payload.sub };
  } catch {
    return null;
  }
}
