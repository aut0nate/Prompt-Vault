import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl = `file:${path.resolve("prisma/playwright.db")}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run prisma:generate && npm run db:push && npm run db:seed && npm run dev",
    url: "http://127.0.0.1:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: testDatabaseUrl,
      APP_URL: "http://127.0.0.1:3000",
      SESSION_SECRET: "playwright-session-secret",
      AUTHENTIK_ISSUER: "https://auth.example.com/application/o/prompt-vault/",
      AUTHENTIK_CLIENT_ID: "playwright-client-id",
      AUTHENTIK_CLIENT_SECRET: "playwright-client-secret",
      AUTHENTIK_ADMIN_EMAIL: "playwright-admin@example.com",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
