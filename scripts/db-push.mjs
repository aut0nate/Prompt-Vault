import { dirname, isAbsolute, join, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
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

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const databasePath = resolveDatabasePath(databaseUrl);
const absoluteDatabaseUrl = `file:${databasePath}`;
const prismaBinary = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");

mkdirSync(dirname(databasePath), { recursive: true });

const diffArgs = existsSync(databasePath)
  ? ["migrate", "diff", "--from-url", absoluteDatabaseUrl, "--to-schema-datamodel", "prisma/schema.prisma", "--script"]
  : ["migrate", "diff", "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script"];

const schemaSql = execFileSync(prismaBinary, diffArgs, {
  cwd: process.cwd(),
  encoding: "utf8",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

if (!schemaSql.trim()) {
  console.log(`SQLite schema is already up to date at ${databasePath}`);
  process.exit(0);
}

execFileSync("sqlite3", [databasePath], {
  cwd: process.cwd(),
  input: schemaSql,
  stdio: ["pipe", "inherit", "inherit"],
});

console.log(`SQLite schema applied to ${databasePath}`);
