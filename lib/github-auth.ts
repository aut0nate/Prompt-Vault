export const GITHUB_STATE_COOKIE = "prompt-vault-github-state";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
};

function requireGitHubEnv(name: "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET" | "GITHUB_ALLOWED_USERNAME") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing. Update your .env file.`);
  }

  return value;
}

export function getAllowedGitHubUsername() {
  return requireGitHubEnv("GITHUB_ALLOWED_USERNAME").trim().toLowerCase();
}

export function getGitHubClientId() {
  return requireGitHubEnv("GITHUB_CLIENT_ID");
}

function getGitHubClientSecret() {
  return requireGitHubEnv("GITHUB_CLIENT_SECRET");
}

export function createGitHubState() {
  return crypto.randomUUID();
}

export function encodeGitHubStateCookie(state: string, nextPath: string) {
  return JSON.stringify({
    state,
    nextPath: nextPath.startsWith("/") ? nextPath : "/admin",
  });
}

export function consumeGitHubState(raw: string | undefined, state: string) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { state: string; nextPath?: string };

    if (parsed.state !== state) {
      return null;
    }

    return parsed.nextPath && parsed.nextPath.startsWith("/") ? parsed.nextPath : "/admin";
  } catch {
    return null;
  }
}

export async function exchangeGitHubCode(code: string, redirectUri: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("GitHub token exchange failed.");
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!payload.access_token) {
    throw new Error(payload.error ?? "GitHub token exchange failed.");
  }

  return payload.access_token;
}

export async function getGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Prompt-Hub",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("GitHub user lookup failed.");
  }

  return (await response.json()) as GitHubUser;
}

export function isAllowedGitHubUser(login: string) {
  return login.trim().toLowerCase() === getAllowedGitHubUsername();
}
