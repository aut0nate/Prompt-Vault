# Prompt Vault Agent Guide

## Project Overview

Prompt Vault is a personal prompt library for saving, organising, searching, favouriting, and reusing LLM prompts.

The application is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma with SQLite
- Playwright for end-to-end tests

The repository is intended for local development first, then Docker packaging and deployment on a VPS.

## Working Rules

- Use British English in all user-facing text, comments, documentation, and UI labels.
- Prefer simple, well-supported, maintainable solutions.
- Do not assume the stack or project structure without checking the repository first.
- Keep secrets out of source control. Use environment variables for credentials and document them clearly.
- Do not hardcode passwords, tokens, or API keys in code or examples.
- Keep changes tidy and consistent with the existing codebase.
- If a task touches behaviour, update or add tests where practical.

## Repository Layout

- `app/` - Next.js routes, pages, layouts, server actions, and API routes.
- `components/` - Reusable UI components.
- `lib/` - Shared application logic, validation, database helpers, and types.
- `prisma/` - Prisma schema and database seed script.
- `scripts/` - Utility scripts for local setup and maintenance.
- `tests/` - Playwright end-to-end tests.
- `Dockerfile` and `docker-compose.yml` - Container build and local Docker runtime.

## Common Commands

Use these commands from the repository root:

- `npm install` - Install dependencies.
- `npm run dev` - Start the local development server.
- `npm run build` - Generate Prisma client and build the production app.
- `npm run start` - Run the built production app.
- `npm run lint` - Run linting.
- `npm run prisma:generate` - Regenerate the Prisma client.
- `npm run db:push` - Push the Prisma schema to the local database.
- `npm run db:seed` - Seed the local database.
- `npm run hash-password -- "password"` - Generate a password hash for `ADMIN_PASSWORD_HASH`.
- `npm run test:e2e` - Run Playwright end-to-end tests.
- `docker compose up --build` - Build and run the app in Docker.

## Local Development

1. Install dependencies.
2. Create `.env` from `.env.example`.
3. Set `DATABASE_URL` and `ADMIN_PASSWORD_HASH`.
4. Run Prisma generate and database setup.
5. Start the app with `npm run dev`.

The admin login lives at `/login` and the admin dashboard lives at `/admin`.

## Testing Guidance

- Prefer local verification before Docker changes.
- Run `npm run lint` after code changes that affect application logic or UI.
- Run `npm run test:e2e` when changing user flows, authentication, prompt management, search, or modal behaviour.
- The Playwright tests expect a seeded database and a working admin login.

## Database Notes

- Prisma uses SQLite.
- The database path is controlled by `DATABASE_URL`.
- Keep generated or local database files out of git.
- Use the seed script when you need predictable test data.

## Security Notes

- Treat `.env` as local-only.
- Never commit secrets, password hashes, or private credentials.
- Review auth-related changes carefully, especially middleware, login actions, and admin routes.
- Be careful when modifying API routes that expose prompt content or allow write operations.

## Docker Notes

- The project is already containerised.
- `Dockerfile` builds the app for production.
- `docker-compose.yml` mounts a named volume for the SQLite database at `/app/prisma`.
- If you change database paths or build steps, update both the Docker files and the README.

## Style Notes

- Follow the existing TypeScript and React style in the repository.
- Keep components focused and avoid unnecessary abstraction.
- Prefer clear names over clever shortcuts.
- Add brief comments only when a block of code would otherwise be hard to follow.

## When Working Here

- Inspect the current implementation before editing.
- Do not overwrite unrelated user changes.
- Prefer `apply_patch` for manual file edits.
- Use non-destructive commands only unless the user explicitly asks for something destructive.
- When making meaningful changes, explain what changed and how it was verified.
