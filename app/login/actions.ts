"use server";

import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSessionToken, setSessionCookie } from "@/lib/auth";

const DUMMY_PASSWORD_HASH = "$2b$12$fSL8pnGrfh9tgYlp6HOEW.kpTJUltrRkIIu7IysHDIzNQ7zAbbHUu";
const maxFailedAttempts = 5;
const failedAttemptWindowMs = 1000 * 60 * 15;
const lockoutMs = 1000 * 60 * 15;

type LoginAttempt = {
  failedAt: number[];
  lockedUntil: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

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

function normaliseHash(hash: string) {
  return hash.replace(/\\\$/g, "$");
}

function timingSafeStringEqual(value: string, expectedValue: string) {
  const valueBuffer = Buffer.from(value);
  const expectedValueBuffer = Buffer.from(expectedValue);
  const maxLength = Math.max(valueBuffer.length, expectedValueBuffer.length, 1);
  const paddedValue = Buffer.alloc(maxLength);
  const paddedExpectedValue = Buffer.alloc(maxLength);

  valueBuffer.copy(paddedValue);
  expectedValueBuffer.copy(paddedExpectedValue);

  return timingSafeEqual(paddedValue, paddedExpectedValue) && valueBuffer.length === expectedValueBuffer.length;
}

async function getLoginKey(username: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || headerStore.get("x-real-ip") || "unknown";

  return `${username.toLowerCase()}:${ipAddress}`;
}

function getActiveAttempt(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return {
      failedAt: [],
      lockedUntil: 0,
    };
  }

  const activeAttempt = {
    failedAt: attempt.failedAt.filter((failedAt) => now - failedAt <= failedAttemptWindowMs),
    lockedUntil: attempt.lockedUntil > now ? attempt.lockedUntil : 0,
  };

  if (!activeAttempt.failedAt.length && !activeAttempt.lockedUntil) {
    loginAttempts.delete(key);
  } else {
    loginAttempts.set(key, activeAttempt);
  }

  return activeAttempt;
}

function isLockedOut(key: string) {
  return getActiveAttempt(key).lockedUntil > Date.now();
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const attempt = getActiveAttempt(key);
  const failedAt = [...attempt.failedAt, now];
  const lockedUntil = failedAt.length >= maxFailedAttempts ? now + lockoutMs : attempt.lockedUntil;

  loginAttempts.set(key, {
    failedAt,
    lockedUntil,
  });
}

function clearFailedLogins(key: string) {
  loginAttempts.delete(key);
}

export async function loginAction(formData: FormData) {
  const nextPath = safeNextPath(formData.get("next"));
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (typeof adminUsername !== "string" || adminUsername.trim().length === 0) {
    loginRedirect("missing_config", nextPath);
  }

  if (typeof adminPasswordHash !== "string" || adminPasswordHash.length === 0) {
    loginRedirect("missing_config", nextPath);
  }

  const loginKey = await getLoginKey(username);
  const expectedUsername = adminUsername.trim();
  const usernameMatches = timingSafeStringEqual(username, expectedUsername);
  const passwordHash = usernameMatches ? normaliseHash(adminPasswordHash) : DUMMY_PASSWORD_HASH;
  let passwordMatches = false;

  try {
    passwordMatches = await bcrypt.compare(password, passwordHash);
  } catch {
    loginRedirect("missing_config", nextPath);
  }

  if (isLockedOut(loginKey) || !usernameMatches || !passwordMatches) {
    recordFailedLogin(loginKey);
    loginRedirect("invalid_credentials", nextPath);
  }

  clearFailedLogins(loginKey);

  const token = await createSessionToken(expectedUsername);
  await setSessionCookie(token);
  redirect(nextPath);
}
