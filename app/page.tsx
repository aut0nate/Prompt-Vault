import Image from "next/image";
import Link from "next/link";

import { LibraryShell } from "@/components/library-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";
import { getPromptList } from "@/lib/prompts";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const isAdmin = await isAuthenticated();
  const initialData = await getPromptList(resolvedSearchParams, isAdmin);
  const initialListParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "prompt") {
      continue;
    }

    if (typeof value === "string" && value) {
      initialListParams.set(key, value);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-line/70 bg-panel/70 px-4 py-2 text-xs uppercase tracking-[0.26em] text-muted">
            Personal prompt library
          </p>
          <div className="flex items-center gap-4 md:gap-5">
            <Image
              src="/prompt-hub-logo.svg"
              alt=""
              aria-hidden="true"
              width={80}
              height={80}
              className="h-16 w-16 shrink-0 md:h-20 md:w-20"
            />
            <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Prompt Hub</h1>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-8 text-foreground/72 md:text-lg">
            Keep your best prompts in one elegant place, search them quickly, and reopen full examples whenever you
            need them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-full border border-line/70 bg-panel/80 px-5 py-3 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
            >
              Open admin
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line/70 bg-panel/80 px-5 py-3 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
            >
              Login
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <LibraryShell initialData={initialData} initialListKey={initialListParams.toString()} isAdmin={isAdmin} />
    </main>
  );
}
