"use client";

import {
  ChevronDown,
  Image,
  LayoutGrid,
  LoaderCircle,
  Mic2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Type,
  Video,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PromptCard } from "@/components/prompt-card";
import { PromptModal } from "@/components/prompt-modal";
import type { PromptListResult } from "@/lib/types";

type LibraryShellProps = {
  initialData: PromptListResult;
  initialListKey: string;
  isAdmin: boolean;
};

export function LibraryShell({ initialData, initialListKey, isAdmin }: LibraryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialData.items);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [availableTags, setAvailableTags] = useState(initialData.availableTags);
  const [availableCategories, setAvailableCategories] = useState(initialData.availableCategories);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const [isRefreshing, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hasHandledInitialQuery = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const deferredSearch = useDeferredValue(searchDraft);
  const promptSlug = searchParams.get("prompt");
  const selectedType = searchParams.get("type") ?? "all";
  const selectedCategory = searchParams.get("category") ?? "";
  const selectedSort = searchParams.get("sort") ?? "newest";
  const favouritesOnly = searchParams.get("favourites") === "1";
  const selectedTags = (searchParams.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const currentListParams = new URLSearchParams(searchParams.toString());
  currentListParams.delete("prompt");
  const currentListKey = currentListParams.toString();

  useEffect(() => {
    setSearchDraft(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";

    if (deferredSearch === currentSearch) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());

    if (deferredSearch) {
      nextParams.set("search", deferredSearch);
    } else {
      nextParams.delete("search");
    }

    nextParams.delete("prompt");
    startTransition(() => {
      router.replace(nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname, { scroll: false });
    });
  }, [deferredSearch, pathname, router, searchParams]);

  useEffect(() => {
    if (!hasHandledInitialQuery.current) {
      hasHandledInitialQuery.current = true;

      if (currentListKey === initialListKey) {
        return;
      }
    }

    async function refreshResults() {
      setErrorMessage("");

      const response = await fetch(`/api/prompts?${currentListKey}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setErrorMessage("The prompt library could not be refreshed. Please try again.");
        return;
      }

      const data = (await response.json()) as PromptListResult;
      setItems(data.items);
      setNextCursor(data.nextCursor);
      setAvailableTags(data.availableTags);
      setAvailableCategories(data.availableCategories);
      setTotalCount(data.totalCount);
    }

    void refreshResults();
  }, [currentListKey, initialListKey]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !nextCursor || isLoadingMore || isRefreshing) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting) {
          setIsLoadingMore(true);

          const params = new URLSearchParams(currentListKey);
          params.set("cursor", nextCursor);

          fetch(`/api/prompts?${params.toString()}`, {
            cache: "no-store",
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error("Could not load more prompts.");
              }

              return (await response.json()) as PromptListResult;
            })
            .then((data) => {
              setItems((current) => [...current, ...data.items]);
              setNextCursor(data.nextCursor);
              setTotalCount(data.totalCount);
            })
            .catch(() => {
              setErrorMessage("More prompts could not be loaded just now.");
            })
            .finally(() => {
              setIsLoadingMore(false);
            });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [currentListKey, isLoadingMore, isRefreshing, nextCursor]);

  function replaceFilters(updater: (params: URLSearchParams) => void) {
    const nextParams = new URLSearchParams(searchParams.toString());
    updater(nextParams);
    nextParams.delete("prompt");

    startTransition(() => {
      router.replace(nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname, { scroll: false });
    });
  }

  function toggleTag(tag: string) {
    replaceFilters((params) => {
      const tags = (params.get("tags") ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (tags.includes(tag)) {
        const filtered = tags.filter((entry) => entry !== tag);

        if (filtered.length) {
          params.set("tags", filtered.join(","));
        } else {
          params.delete("tags");
        }
      } else {
        params.set("tags", [...tags, tag].join(","));
      }
    });
  }

  function openPrompt(slug: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("prompt", slug);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  function closePrompt() {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("prompt");
    router.replace(nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname, { scroll: false });
  }

  const noResults = !items.length && !isRefreshing;
  const hasActiveFilters = Boolean(
    searchDraft || selectedType !== "all" || selectedCategory || selectedTags.length || favouritesOnly,
  );
  const typeFilters = [
    { value: "all", label: "All prompts", icon: LayoutGrid },
    { value: "text", label: "Writing", icon: Type },
    { value: "image", label: "Images", icon: Image },
    { value: "video", label: "Video", icon: Video },
    { value: "audio", label: "Audio", icon: Mic2 },
  ];

  function resetFilters() {
    setSearchDraft("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <>
      <div className={promptSlug ? "pointer-events-none blur-md transition" : "transition"}>
        <section className="relative mb-6 overflow-hidden rounded-[1.75rem] bg-[#242b26] px-6 py-10 text-[#f8f4eb] shadow-[0_24px_70px_rgba(24,30,26,0.16)] md:px-10 md:py-12 lg:px-14">
          <div className="hero-grid absolute inset-0 opacity-25" aria-hidden="true" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)] lg:items-end">
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[#ef9f72]">Your creative workbench</p>
              <h2 className="font-display max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[4.3rem]">
                Good ideas deserve a place to live.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#f8f4eb]/68 lg:pb-1 lg:text-base">
              Find, adapt and reuse the prompts that help you do your best work—without digging through old chats.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-[1.35rem] border border-line/60 bg-panel/65 p-3 backdrop-blur-lg lg:sticky lg:top-6">
            <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Browse library</p>
            <nav className="scrollbar-hide flex gap-1 overflow-x-auto lg:block lg:space-y-1" aria-label="Prompt types">
              {typeFilters.map(({ value, label, icon: Icon }) => {
                const isSelected = selectedType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      replaceFilters((params) => {
                        if (value === "all") params.delete("type");
                        else params.set("type", value);
                      })
                    }
                    className={`flex w-auto shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:w-full lg:gap-3 ${
                      isSelected ? "bg-foreground text-background" : "text-foreground/66 hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </nav>

            {isAdmin ? (
              <>
                <div className="my-3 h-px bg-line/45" />
                <button
                  type="button"
                  onClick={() =>
                    replaceFilters((params) => {
                      if (favouritesOnly) params.delete("favourites");
                      else params.set("favourites", "1");
                    })
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    favouritesOnly ? "bg-accent text-white" : "text-foreground/66 hover:bg-background hover:text-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 ${favouritesOnly ? "fill-current" : ""}`} />
                  Favourites
                </button>
              </>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line/60 px-3 py-2.5 text-xs font-bold text-muted transition hover:border-foreground/30 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear filters
              </button>
            ) : null}
          </aside>

          <div className="min-w-0">
            <section className="mb-5 rounded-[1.35rem] border border-line/60 bg-panel/75 p-3 shadow-sm backdrop-blur-lg">
              <div className="grid gap-2 xl:grid-cols-[minmax(18rem,1fr)_12rem_10rem]">
                <label className="flex h-12 items-center gap-3 rounded-xl bg-background/80 px-4 transition focus-within:ring-2 focus-within:ring-accent/30">
                  <Search className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted/75"
                    placeholder="Search content or tags"
                  />
                  <span className="hidden rounded-md border border-line/60 px-2 py-1 font-mono text-[10px] text-muted sm:block">⌘ K</span>
                </label>

                <label className="relative">
                  <span className="sr-only">Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) =>
                      replaceFilters((params) => {
                        if (event.target.value) params.set("category", event.target.value);
                        else params.delete("category");
                      })
                    }
                    className="h-12 w-full appearance-none rounded-xl bg-background/80 px-4 pr-10 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">All categories</option>
                    {availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted" />
                </label>

                <label className="relative">
                  <span className="sr-only">Sort prompts</span>
                  <select
                    value={selectedSort}
                    onChange={(event) => replaceFilters((params) => params.set("sort", event.target.value))}
                    className="h-12 w-full appearance-none rounded-xl bg-background/80 px-4 pr-10 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted" />
                </label>
              </div>

              <section data-testid="homepage-tags" className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="inline-flex shrink-0 items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.17em] text-muted">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Topics
                </span>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      data-testid="homepage-tag"
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        isSelected ? "bg-accent text-white" : "bg-background/70 text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </section>
            </section>

            {errorMessage ? <div className="status-error mb-5 rounded-xl px-5 py-4 text-sm">{errorMessage}</div> : null}

            <div className="mb-5 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Collection</p>
                <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-0.03em]">
                  {hasActiveFilters ? "Filtered prompts" : "All prompts"}
                </h2>
              </div>
              <p className="pb-1 text-xs font-semibold text-muted">
                {isRefreshing ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Refreshing</span> : `${totalCount} ${totalCount === 1 ? "prompt" : "prompts"}`}
              </p>
            </div>

            {noResults ? (
              <section className="rounded-[1.35rem] border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
                <h2 className="font-display text-3xl font-semibold">Nothing found—yet.</h2>
                <p className="mt-3 text-sm leading-7 text-foreground/65">Try a broader search or clear your filters.</p>
                <button type="button" onClick={resetFilters} className="mt-6 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background">Show all prompts</button>
              </section>
            ) : (
              <>
                <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {items.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} onOpen={openPrompt} />)}
                </section>

                <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center">
                  {isLoadingMore ? <span className="inline-flex items-center gap-2 text-sm text-muted"><LoaderCircle className="h-4 w-4 animate-spin" />Loading more prompts…</span> : null}
                </div>

                {!nextCursor && items.length > 0 ? (
                  <p data-testid="end-of-page" className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-muted">That’s the whole collection</p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <PromptModal slug={promptSlug} onClose={closePrompt} />
    </>
  );
}
