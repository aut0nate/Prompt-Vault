import { NextResponse } from "next/server";

import { createGitHubState, encodeGitHubStateCookie, getGitHubClientId, GITHUB_STATE_COOKIE } from "@/lib/github-auth";
import { getAppOrigin } from "@/lib/app-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/admin";
  const state = createGitHubState();
  const redirectUri = `${getAppOrigin(request)}/api/auth/github/callback`;

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", getGitHubClientId());
  githubUrl.searchParams.set("redirect_uri", redirectUri);
  githubUrl.searchParams.set("scope", "read:user");
  githubUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubUrl);
  response.cookies.set(GITHUB_STATE_COOKIE, encodeGitHubStateCookie(state, safeNextPath), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
