"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

import { createSessionToken, setSessionCookie } from "@/lib/auth";

const ADMIN_USERNAME = "arkadmin";

function safeNextPath(value: FormDataEntryValue | null) {
  const nextPath = String(value ?? "/admin");

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

function loginRedirect(error: string, nextPath: string): never {
  const params = new URLSearchParams({ error, next: nextPath });
  redirect(`/login?${params.toString()}`);
}

function passwordsMatch(password: string, expectedPassword: string) {
  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(expectedPassword);

  if (passwordBuffer.length !== expectedPasswordBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
}

export async function loginAction(formData: FormData) {
  const nextPath = safeNextPath(formData.get("next"));
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    loginRedirect("missing_password", nextPath);
  }

  if (username !== ADMIN_USERNAME || !passwordsMatch(password, adminPassword)) {
    loginRedirect("invalid_credentials", nextPath);
  }

  const token = await createSessionToken(ADMIN_USERNAME);
  await setSessionCookie(token);
  redirect(nextPath);
}
