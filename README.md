# Prompt Vault

Prompt Vault is a simple personal prompt library for saving, organising and reusing prompts.

![Login](./images/Prompt-Vault-Home.png)

## Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Prisma with SQLite
- Playwright for end-to-end tests

## Configuration

1. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Create a [GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app):

   Use this callback URL for local development:

   ```text
   http://localhost:3000/api/auth/github/callback
   ```

3. Update `.env`:

   - `APP_ORIGIN`
   - `SESSION_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_ALLOWED_USERNAME`

Environment notes:

- Set `APP_ORIGIN` to the full public address where Prompt Vault will run.
- For local development, use `http://localhost:3000`.
- For a VPS or Docker deployment behind a domain, use your real public URL, for example `https://prompts.domain.com`.
- `SESSION_SECRET` is required for both local and Docker use. It signs login sessions.
- Use a long random value for `SESSION_SECRET` and keep it stable for a given deployment.
- Changing `SESSION_SECRET` will sign everyone out.
- You can generate a suitable secret with:

  ```bash
  openssl rand -base64 32
  ```

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate the Prisma client and create the database:

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

## Run with Docker

1. Build and start the container:

   ```bash
   docker compose up --build
   ```

2. Then open [http://localhost:3000](http://localhost:3000).

Notes:

- The SQLite database and prompt attachments are stored in the local `storage/` folder and mounted into the container at `/app/data`.
- The main database file lives at `storage/dev.db`.
- Prompt attachments live under `storage/prompt-attachments/`.
- Docker uses an absolute SQLite path inside the container, `/app/data/dev.db`, so build-time and runtime Prisma point at the same database file.
- The container prepares the mounted `storage/` folder on startup, then runs the application as the non-root `nextjs` user.

## CI/CD

This repository uses GitHub Actions to test changes, build the production Docker image, and publish it to the public Docker Hub repository at `aut0nate/prompt-vault`.

The workflow runs on pull requests and branch pushes:

1. Install dependencies with `npm ci`.
2. Run linting.
3. Build the Next.js application.
4. Run Playwright end-to-end tests.
5. Build the Docker image.
6. Start the image and run a smoke test against the homepage.

When a push lands on `main`, the workflow also publishes the image to Docker Hub as:

- `aut0nate/prompt-vault:latest`
- `aut0nate/prompt-vault:<git-commit-sha>`

The commit SHA tag is useful for rollbacks because it points at one exact build.

### GitHub Secrets

Add these repository secrets in GitHub before relying on publishing from `main`:

- `DOCKERHUB_USERNAME` - your Docker Hub username.
- `DOCKERHUB_TOKEN` - a Docker Hub access token with permission to push to `aut0nate/prompt-vault`.

Use a Docker Hub access token rather than your Docker Hub password. The image repository is public, but GitHub Actions still needs authenticated push access.

## VPS Deployment

The VPS should pull the tested image from Docker Hub rather than building the app directly on the server.

Use `docker-compose.prod.yml` on the VPS. It expects:

- The public Docker Hub image `aut0nate/prompt-vault:latest`.
- A local `.env` file on the VPS containing production secrets.
- A local `storage/` directory for the SQLite database and prompt attachments.
- An existing external Docker network called `edge-net` for your reverse proxy.

Example deployment flow on the VPS:

```bash
docker compose -f docker-compose.prod.yml pull prompt-vault
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f prompt-vault
```

Because the image is public, the VPS does not need `docker login` to pull it. Keep production secrets only in the VPS `.env` file. Do not commit that file to GitHub.

Before releases that touch database behaviour, back up the persistent storage directory:

```bash
cp -R storage "storage-backup-$(date +%Y-%m-%d)"
```

After deployment, verify:

- The public homepage loads.
- `/login` loads.
- GitHub login works with the production callback URL.
- Existing prompts and attachments are still present.

## CI/CD Best Practices

- Prefer pull requests so CI runs before code reaches `main`.
- Enable branch protection for `main` after the workflow is passing reliably.
- Keep secrets in GitHub Actions secrets or the VPS `.env`, never in code or Docker images.
- Keep SQLite data and uploaded files in the persistent `storage/` mount, not inside the image.
- Use immutable SHA image tags for rollback, even when deploying `latest`.
- Keep the reverse proxy separate from the app container.
- Review Dependabot pull requests regularly for npm and GitHub Actions updates.
- Consider automatic deployment later, after the manual pull-and-restart process is comfortable.

## Admin Area

- Public visitors can browse prompts.
- Only the allowed GitHub account can sign in and manage prompts.
- The login page lives at `/login`.
- The admin dashboard lives at `/admin`.

## Backups and Persistence

- The `storage/` folder is ignored by git and should be treated as local application data.
- Rebuilding or recreating the container will not remove your prompts as long as `storage/` remains in place.
- Do not run `docker compose down -v` if you want to keep your data.
- Back up Prompt Vault by copying the `storage/` folder to another location.

Example backup command:

```bash
cp -R storage "storage-backup-$(date +%Y-%m-%d)"
```

If you already have data in the old Docker volume, copy it into `storage/` before switching fully to the new setup.

## AI-Assisted Development

Prompt Vault was built with **OpenAI Codex using GPT-5.4**. This repository includes an [`AGENTS.md`](./AGENTS.md) file, which provides structured instructions and context for AI coding agents. It defines expectations, constraints, and project-specific guidance to help keep contributions consistent and reliable.

## Contributions

Contributions, ideas, and suggestions are welcome.

If you have improvements, feature ideas, or bug fixes, feel free to open an issue or submit a pull request. All contributions are appreciated and help improve the project.
