import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogIn } from "lucide-react";

import { getSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/admin");
  }

  const resolvedSearchParams = await searchParams;
  const nextPath =
    typeof resolvedSearchParams.next === "string" &&
    resolvedSearchParams.next.startsWith("/") &&
    !resolvedSearchParams.next.startsWith("//")
      ? resolvedSearchParams.next
      : "/admin";
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";

  const errorMessage =
    error === "invalid_state"
      ? "That sign-in request expired. Please try again."
      : error === "missing_config"
        ? "Sign-in is not configured. Check the Authentik environment variables."
        : error === "auth_failed"
          ? "Authentik sign-in could not be completed."
        : "";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 md:px-8">
      <Link
        href="/"
        prefetch={false}
        className="relative z-10 inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/80 px-5 py-3 text-sm font-semibold transition hover:border-accent/60 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <section className="relative z-10 flex min-h-[calc(100vh-5.5rem)] items-center justify-center py-12">
        <div className="w-full max-w-[560px] rounded-[2rem] border border-line/70 bg-panel/90 px-6 py-9 shadow-[0_24px_90px_rgba(0,0,0,0.12)] dark:bg-panel/82 dark:shadow-[0_30px_120px_rgba(0,0,0,0.42)] sm:px-12">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-line/70 bg-background/55 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_60px_rgb(0_0_0/0.16)]">
            <Image
              src="/prompt-vault-logo-hex.svg"
              alt=""
              aria-hidden="true"
              width={74}
              height={74}
              className="h-[74px] w-[74px]"
            />
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-normal text-accent sm:text-3xl">Prompt Vault</h1>
            <p className="mt-2 text-lg font-bold text-foreground sm:text-xl">
              Sign in to your library
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {errorMessage ? (
              <p className="status-error rounded-2xl px-4 py-3 text-sm font-medium">{errorMessage}</p>
            ) : null}

            <Link
              href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
              prefetch={false}
              className="h-14 w-full rounded-2xl bg-accent px-5 text-base font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-4 focus:ring-accent/24"
            >
              <span className="flex h-full items-center justify-center gap-2">
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Sign in with Authentik
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
