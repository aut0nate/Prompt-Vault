import { dirname, isAbsolute, join, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

function resolveDatabasePath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("This setup currently supports SQLite DATABASE_URL values beginning with file:.");
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (!rawPath) {
    throw new Error("DATABASE_URL is missing the SQLite file path.");
  }

  return isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), "prisma", rawPath);
}

const prismaBinary = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const databasePath = resolveDatabasePath(databaseUrl);
const absoluteDatabaseUrl = `file:${databasePath}`;

mkdirSync(dirname(databasePath), { recursive: true });

execFileSync(prismaBinary, ["db", "push", "--skip-generate"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: absoluteDatabaseUrl,
  },
});

const promptAttachmentTable = execFileSync(
  "sqlite3",
  [
    databasePath,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'PromptAttachment' LIMIT 1;",
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
  },
).trim();

if (promptAttachmentTable !== "PromptAttachment") {
  throw new Error(`Prisma reported success, but PromptAttachment is missing from ${databasePath}.`);
}

console.log(`SQLite schema is ready at ${databasePath}`);
