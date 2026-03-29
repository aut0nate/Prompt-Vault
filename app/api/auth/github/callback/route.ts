import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getAppOrigin } from "@/lib/app-origin";
import { consumeGitHubState, exchangeGitHubCode, getGitHubUser, GITHUB_STATE_COOKIE, isAllowedGitHubUser } from "@/lib/github-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appOrigin = getAppOrigin(request);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_response", appOrigin));
  }

  const stateCookie = request.headers.get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${GITHUB_STATE_COOKIE}=`))
    ?.slice(GITHUB_STATE_COOKIE.length + 1);
  const nextPath = consumeGitHubState(stateCookie ? decodeURIComponent(stateCookie) : undefined, state);

  if (!nextPath) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", appOrigin));
  }

  try {
    const redirectUri = `${appOrigin}/api/auth/github/callback`;
    const accessToken = await exchangeGitHubCode(code, redirectUri);
    const githubUser = await getGitHubUser(accessToken);

    if (!isAllowedGitHubUser(githubUser.login)) {
      const response = NextResponse.redirect(new URL("/login?error=not_allowed", appOrigin));
      response.cookies.delete(GITHUB_STATE_COOKIE);
      return response;
    }

    const token = await createSessionToken(githubUser.login);
    const response = NextResponse.redirect(new URL(nextPath, appOrigin));
    response.cookies.delete(GITHUB_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=github_auth_failed", appOrigin));
    response.cookies.delete(GITHUB_STATE_COOKIE);
    return response;
  }
}
