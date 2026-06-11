import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSessionToken, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export { createSessionToken, SESSION_COOKIE_NAME, verifySessionToken };

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/admin");
  }

  return session;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
