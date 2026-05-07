# Prompt Vault

## Introduction

Prompt Vault is a personal web app for saving, organising, searching, and reusing LLM prompts in one place.

It is for people who want an easier way to keep useful prompts organised without leaving them scattered across notes apps, chat histories, and text files. The app stores prompts in a local SQLite database, lets you browse and search them in a clearer interface, and gives one configured admin user access to manage the library.

![Screenshot or Preview](./images/Prompt-Vault-Home.png)

## Features

- Save prompts with a title, summary, category, and full Markdown content
- Organise prompts with tags and prompt types
- Search and filter the library by text, category, tag, type, and favourites
- Mark important prompts as favourites for quicker access
- Attach supporting files such as text, JSON, CSV, PDF, or YAML documents
- Browse prompts publicly while limiting editing to the configured admin user

## Stack

- Node.js 20+
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Playwright
- Docker

## Requirements

Before running this project, install:

- Node.js 20 or newer
- npm
- Docker and Docker Compose, if you want to test or deploy the app with Docker

## Configuration (.env)

1. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with the required values:

   - `DATABASE_URL`
   - `APP_ORIGIN`
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`

Example `.env`:

```bash
DATABASE_URL="file:./dev.db"
APP_ORIGIN="http://localhost:3000"
SESSION_SECRET="replace-with-a-long-random-string"
ADMIN_PASSWORD="replace-with-a-strong-admin-password"
```

Environment notes:

- `DATABASE_URL` controls the SQLite database path for local development. The default `file:./dev.db` works for the local npm setup.
- `APP_ORIGIN` should be the full public address where Prompt Vault runs. Use `http://localhost:3000` locally, and your real domain in production.
- `SESSION_SECRET` is required for both local and Docker use. It signs login sessions, should be a long random value, and should stay stable for a given deployment.
- Changing `SESSION_SECRET` will sign everyone out.
- `ADMIN_PASSWORD` is the password for the built-in `arkadmin` user. Use a strong, unique value and keep it out of git.

You can generate a suitable `SESSION_SECRET` with:

```bash
openssl rand -base64 32
```

## Test Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Prepare the application:

   ```bash
   npm run prisma:generate
   npm run db:push
   npm run db:seed
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Test Locally Using Docker

Use Docker locally when you want to test the application before deploying to your server. Start by building the image:

1. Build and start the local container:

   ```bash
   docker compose up --build
   ```

2. Open [http://localhost:3000](http://localhost:3000).

Notes:

- The local `docker-compose.yaml` file publishes port `3000` to `localhost`.
- The SQLite database and prompt attachments are stored in the local `storage/` folder and mounted into the container at `/app/data`.
- The main database file lives at `storage/dev.db`.
- Prompt attachments live under `storage/prompt-attachments/`.
- Docker uses the absolute SQLite path `/app/data/dev.db` inside the container so build-time and runtime Prisma point at the same database file.
- The container prepares the mounted `storage/` folder on startup, then runs the application as the non-root `nextjs` user.

## Server Deployment

You can run this on your own server by pulling the latest Docker image from `ghcr.io/aut0nate/prompt-vault:${IMAGE_TAG:-latest}`.

Use the structure that fits your own environment and preferred deployment methods.
For public-facing access, put the service behind HTTPS using a reverse proxy such as Nginx Proxy Manager, Caddy, Traefik, or any other preferred method.

For most Docker-based deployments:

1. Create a directory in your chosen location on your server, for example `/opt/stacks/prompts`.
2. Change into this directory.
3. Ensure the `docker-compose.prod.yaml` file is saved in this directory.
4. Create a `.env` file:

   ```bash
   APP_ORIGIN="https://prompts.example.com"
   SESSION_SECRET="replace-with-a-long-random-string"
   ADMIN_PASSWORD="replace-with-a-strong-admin-password"
   IMAGE_TAG=latest
   ```

5. Create the persistent storage directory:

   ```bash
   mkdir -p storage
   ```

6. Create the external Docker network or use an existing one. If you use an existing network, update the `docker-compose.prod.yaml` file accordingly.

   ```bash
   docker network create edge-net
   ```

7. Start the public image:

   ```bash
   docker compose -f docker-compose.prod.yaml up -d
   ```

8. Verify the public URL after deployment.

Example production files:

- `docker-compose.prod.yaml`
- `.env`
- `storage/`

After deployment, verify:

- The public homepage loads.
- `/login` loads.
- The `arkadmin` login works with the configured `ADMIN_PASSWORD`.
- Existing prompts and attachments are still present.

## AI-Assisted Development

Prompt Vault was built with **OpenAI Codex using GPT-5.4**. This repository includes an [`AGENTS.md`](./AGENTS.md) file, which provides structured instructions and context for AI coding agents. It defines expectations, constraints, and project-specific guidance to help keep contributions consistent and reliable.

## Contributions

Contributions, ideas, and suggestions are welcome.

If you have improvements, feature ideas, or bug fixes, feel free to open an issue or submit a pull request. All contributions are appreciated and help improve the project.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
