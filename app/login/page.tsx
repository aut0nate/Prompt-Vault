import { redirect } from "next/navigation";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 .5C5.65.5.5 5.8.5 12.34c0 5.23 3.3 9.67 7.87 11.24.58.11.79-.26.79-.58 0-.29-.01-1.05-.02-2.06-3.2.71-3.87-1.58-3.87-1.58-.52-1.36-1.28-1.72-1.28-1.72-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.03 1.82 2.71 1.29 3.37.99.1-.77.4-1.29.73-1.59-2.55-.3-5.23-1.32-5.23-5.86 0-1.29.45-2.35 1.18-3.18-.12-.3-.51-1.52.11-3.17 0 0 .97-.32 3.19 1.21a10.8 10.8 0 0 1 5.8 0c2.21-1.53 3.18-1.21 3.18-1.21.63 1.65.24 2.87.12 3.17.74.83 1.18 1.89 1.18 3.18 0 4.55-2.68 5.56-5.24 5.85.41.36.78 1.07.78 2.16 0 1.56-.02 2.82-.02 3.2 0 .32.2.7.8.58 4.56-1.57 7.86-6.01 7.86-11.24C23.5 5.8 18.35.5 12 .5Z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/admin");
  }

  const resolvedSearchParams = await searchParams;
  const nextPath =
    typeof resolvedSearchParams.next === "string" && resolvedSearchParams.next.startsWith("/")
      ? resolvedSearchParams.next
      : "/admin";
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";

  const errorMessage =
    error === "not_allowed"
      ? "That GitHub account is not allowed to access this application."
      : error === "invalid_state"
        ? "The login session expired or was invalid. Try again."
        : error === "missing_oauth_response" || error === "github_auth_failed"
          ? "GitHub sign-in failed. Try again."
          : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 md:px-8 md:py-12">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2.5rem] border border-line/70 bg-panel/65 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.06)]">
          <p className="text-sm uppercase tracking-[0.28em] text-muted">Private editing access</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-6xl">Sign in to manage Prompt Vault</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-foreground/72">
            The library can be browsed publicly, but editing access is restricted to an approved GitHub account.
          </p>
        </div>

        <div className="self-center">
          <div className="space-y-5 rounded-[2rem] border border-line/70 bg-panel/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
            {errorMessage ? (
              <p className="status-error rounded-2xl px-4 py-3 text-sm">
                {errorMessage}
              </p>
            ) : null}

            <Link
              href={`/api/auth/github/start?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-line/70 bg-black px-5 py-3.5 text-base font-semibold text-white transition hover:border-accent/60 hover:bg-neutral-950"
            >
              <GitHubMark />
              Sign in with GitHub
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
