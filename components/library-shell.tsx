"use client";

import { LoaderCircle, Search, SlidersHorizontal, Star } from "lucide-react";
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

  return (
    <>
      <div className={promptSlug ? "pointer-events-none blur-md transition" : "transition"}>
        <section className="mb-10 grid gap-3 rounded-[2rem] border border-line/70 bg-panel/60 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.05)] backdrop-blur-sm xl:grid-cols-[minmax(0,1.05fr)_minmax(220px,1.15fr)_160px_180px_170px_auto] xl:items-end">
          <div className="space-y-2 pr-2 xl:max-w-sm">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted">
              <SlidersHorizontal className="h-4 w-4" />
              Refine prompts
            </p>
            <p className="text-sm leading-6 text-foreground/68">
              Search by content or tags, filter by type and category, sort by date, and keep your favourite prompts
              close to hand.
            </p>
          </div>

          <label className="flex h-11 items-center gap-3 rounded-[1.1rem] border border-line/60 bg-background/72 px-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-accent/65">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted/80"
              placeholder="Search content or tags"
            />
          </label>

          <select
            value={selectedType}
            onChange={(event) =>
              replaceFilters((params) => {
                const value = event.target.value;

                if (value === "all") {
                  params.delete("type");
                } else {
                  params.set("type", value);
                }
              })
            }
            className="h-11 min-w-0 rounded-[1.1rem] border border-line/60 bg-background/72 px-3 text-sm outline-none transition focus:border-accent/65"
          >
            <option value="all">All types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(event) =>
              replaceFilters((params) => {
                const value = event.target.value;

                if (value) {
                  params.set("category", value);
                } else {
                  params.delete("category");
                }
              })
            }
            className="h-11 min-w-0 rounded-[1.1rem] border border-line/60 bg-background/72 px-3 text-sm outline-none transition focus:border-accent/65"
          >
            <option value="">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(event) =>
              replaceFilters((params) => {
                const value = event.target.value;
                params.set("sort", value);
              })
            }
            className="h-11 min-w-0 rounded-[1.1rem] border border-line/60 bg-background/72 px-3 text-sm outline-none transition focus:border-accent/65"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {isAdmin ? (
            <button
              type="button"
              onClick={() =>
                replaceFilters((params) => {
                  if (favouritesOnly) {
                    params.delete("favourites");
                  } else {
                    params.set("favourites", "1");
                  }
                })
              }
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[1.1rem] border px-4 text-sm font-medium transition ${
                favouritesOnly
                  ? "border-accent bg-accent text-white"
                  : "border-line/60 bg-background/72 text-foreground hover:border-accent/60"
              }`}
            >
              <Star className={`h-4 w-4 ${favouritesOnly ? "fill-current" : ""}`} />
              {favouritesOnly ? "Showing favourites" : "Favourites"}
            </button>
          ) : (
            <div className="hidden lg:block" />
          )}
        </section>

        <section data-testid="homepage-tags" className="mb-8 flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                data-testid="homepage-tag"
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-line/70 bg-panel/60 text-foreground/75 hover:border-accent hover:bg-accent hover:text-white"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </section>

        {errorMessage ? (
          <div className="status-error mb-6 rounded-[1.5rem] px-5 py-4 text-sm">
            {errorMessage}
          </div>
        ) : null}

        {noResults ? (
          <section className="rounded-[2rem] border border-dashed border-line/70 bg-panel/50 px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">No prompts matched your filters</h2>
            <p className="mt-3 text-sm leading-7 text-foreground/70">
              Try a broader search, remove a tag, or switch back to all prompt types.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">{totalCount} prompts found</p>
              {isRefreshing ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Refreshing
                </span>
              ) : null}
            </div>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onOpen={openPrompt} />
              ))}
            </section>

            <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center">
              {isLoadingMore ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading more prompts…
                </span>
              ) : null}
            </div>

            {!nextCursor && items.length > 0 ? (
              <p data-testid="end-of-page" className="mt-4 text-center text-sm font-medium text-muted">
                You have reached the end of the page
              </p>
            ) : null}
          </>
        )}
      </div>

      <PromptModal slug={promptSlug} onClose={closePrompt} />
    </>
  );
}
