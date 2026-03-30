import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-muted">Prompt Vault</p>
      <h1 className="mt-4 text-4xl font-semibold">That page could not be found</h1>
      <p className="mt-4 text-base leading-8 text-foreground/72">
        The link may be out of date, or the prompt may have been removed from the library.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-line/70 bg-panel px-5 py-3 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
      >
        Return to the library
      </Link>
    </main>
  );
}
