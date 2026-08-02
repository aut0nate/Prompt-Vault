import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, LogIn, Plus } from "lucide-react";

import { LibraryShell } from "@/components/library-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";
import { getPromptList } from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Prompt Vault",
};

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
    <main className="mx-auto min-h-screen w-full max-w-[96rem] px-4 pb-16 pt-4 md:px-7 md:pt-6">
      <header className="mb-6 flex items-center justify-between rounded-[1.4rem] border border-line/60 bg-panel/70 px-4 py-3 shadow-sm backdrop-blur-xl md:px-5">
        <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/prompt-vault-logo.svg"
              alt=""
              aria-hidden="true"
              width={80}
              height={80}
              className="h-10 w-10 shrink-0 md:h-11 md:w-11"
            />
          <div className="min-w-0">
            <h1 className="font-display truncate text-xl font-semibold leading-none tracking-[-0.03em] md:text-2xl">Prompt Vault</h1>
            <p className="mt-1 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:block">
              A library for better thinking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-accent hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Manage prompts
            </Link>
          ) : (
            <Link
              href="/login"
              className="group inline-flex h-10 items-center gap-2 rounded-xl border border-line/70 bg-background/70 px-4 text-sm font-semibold transition hover:border-foreground/40"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign In
              <ArrowUpRight className="hidden h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <LibraryShell initialData={initialData} initialListKey={initialListParams.toString()} isAdmin={isAdmin} />
    </main>
  );
}
