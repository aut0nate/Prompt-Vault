import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <header className="mb-10 flex flex-col gap-4 rounded-[2rem] border border-line/70 bg-panel/70 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted">Prompt Vault admin</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Manage your prompt library</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-line/70 bg-background/70 px-5 py-3 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
          >
            View library
          </Link>
          <Link
            href="/admin/prompts/new"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Add prompt
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-line/70 bg-background/70 px-5 py-3 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
            >
              Sign out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </header>

      {children}
    </main>
  );
}
