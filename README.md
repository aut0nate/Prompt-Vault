# Prompt Vault

Prompt Vault is a simple personal prompt library for saving, organising, searching, favouriting, and reusing LLM prompts.
This application was created using OpenAI Codex.

## Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Prisma with SQLite
- Playwright for end-to-end tests

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Create a GitHub OAuth app:

   ```bash
   Callback URL: http://localhost:3000/api/auth/github/callback
   ```

4. Add your GitHub OAuth values to `.env`:

   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_ALLOWED_USERNAME`

5. Generate the Prisma client and create the database:

   ```bash
   npm run prisma:generate
   npm run db:push
   npm run db:seed
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

## Admin area

- Public visitors can browse prompts.
- Only the allowed GitHub account can sign in and manage prompts.
- The login page lives at `/login`.
- The admin dashboard lives at `/admin`.

## Docker

Run Prompt Vault with Docker for local testing:

```bash
cp .env.example .env
```

Update `.env` with your values for:

- `SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_ALLOWED_USERNAME`

If you are using GitHub OAuth locally, set the callback URL in your GitHub OAuth app to:

```bash
http://localhost:3000/api/auth/github/callback
```

Build and start the container:

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

Useful Docker commands:

```bash
docker compose up --build -d
docker compose logs -f
docker compose down
```

Notes:

- The SQLite database and prompt attachments are stored in the local `storage/` folder and mounted into the container at `/app/data`.
- The main database file lives at `storage/dev.db`.
- Prompt attachments live under `storage/prompt-attachments/`.
- Docker uses an absolute SQLite path inside the container, `/app/data/dev.db`, so build-time and runtime Prisma point at the same database file.
- The runtime image installs OpenSSL for Prisma, carries production-only Node dependencies, and runs as a non-root user.

## Backups and persistence

- The `storage/` folder is ignored by git and should be treated as local application data.
- Rebuilding or recreating the container will not remove your prompts as long as `storage/` remains in place.
- Do not run `docker compose down -v` if you want to keep your data.
- Back up Prompt Vault by copying the `storage/` folder to another location.

Example backup command:

```bash
cp -R storage "storage-backup-$(date +%Y-%m-%d)"
```

If you already have data in the old Docker volume, copy it into `storage/` before switching fully to the new setup.
