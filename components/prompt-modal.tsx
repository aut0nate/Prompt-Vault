"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, Download, LoaderCircle, Paperclip, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { PromptContentRenderer } from "@/components/prompt-content-renderer";
import { formatFileSize } from "@/lib/attachment-config";
import type { PromptDetailRecord } from "@/lib/types";
import { formatPromptType, slugify } from "@/lib/utils";

type PromptModalProps = {
  slug: string | null;
  onClose: () => void;
};

export function PromptModal({ slug, onClose }: PromptModalProps) {
  const [prompt, setPrompt] = useState<PromptDetailRecord | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!slug) {
      setPrompt(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetch(`/api/prompts/${slug}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load prompt details.");
        }

        return (await response.json()) as { prompt: PromptDetailRecord };
      })
      .then((data) => {
        if (!cancelled) {
          setPrompt(data.prompt);
          setStatus("idle");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [slug, onClose]);

  if (!slug) {
    return null;
  }

  function downloadAllFiles() {
    if (!prompt?.attachments.length) {
      return;
    }

    for (const attachment of prompt.attachments) {
      const anchor = document.createElement("a");
      anchor.href = attachment.downloadUrl;
      anchor.download = attachment.originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close prompt"
        onClick={onClose}
        className="absolute inset-0 bg-[#172019]/70 backdrop-blur-md"
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-line/60 bg-background shadow-[0_32px_100px_rgba(0,0,0,0.35)] sm:max-h-[90vh]">
        <div data-testid="prompt-modal" className="hidden" />
        <div className="flex items-start justify-between gap-6 border-b border-line/55 bg-panel/65 px-5 py-6 md:px-9 md:py-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              <span>{prompt ? prompt.category : "Loading prompt"}</span>
              {prompt?.isFavourite ? (
                <span className="inline-flex items-center gap-1 text-[rgb(var(--accent))]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Favourite
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              <h2 className="font-display max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl">
                {prompt?.title ?? "Loading prompt..."}
              </h2>
              {prompt ? <p className="max-w-3xl text-sm leading-7 text-foreground/65 md:text-base">{prompt.summary}</p> : null}
            </div>

            {prompt ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="rounded-lg bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/72">
                    {formatPromptType(prompt.type)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${slugify(tag)}`}
                      className="rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground/65 transition hover:bg-accent hover:text-white"
                    >
                      {tag}
                    </Link>
                ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line/60 bg-background p-2.5 text-muted transition hover:border-foreground/30 hover:text-foreground"
            aria-label="Close prompt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-9 md:py-7">
          {status === "loading" ? (
            <div className="flex min-h-[18rem] items-center justify-center text-muted">
              <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
              Loading prompt details…
            </div>
          ) : null}

          {status === "error" ? (
            <div className="status-error rounded-[1.5rem] p-4 text-sm">
              The prompt details could not be loaded. Please try again.
            </div>
          ) : null}

          {prompt ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prompt content</p>
                <div className="flex flex-wrap items-center justify-end gap-3">
                {prompt.attachments.length > 1 ? (
                  <button
                    type="button"
                    onClick={downloadAllFiles}
                    className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-4 py-2 text-sm font-semibold text-foreground/76 transition hover:border-accent/60 hover:text-accent"
                  >
                    <Download className="h-4 w-4" />
                    Download all files
                  </button>
                ) : null}
                <CopyButton text={prompt.contentMarkdown} />
                </div>
              </div>

              <article className="rounded-[1.25rem] border border-line/55 bg-panel/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] md:p-8">
                <PromptContentRenderer content={prompt.contentMarkdown} />
              </article>

              {prompt.attachments.length ? (
                <section className="rounded-[1.25rem] border border-line/55 bg-panel/70 p-5 md:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-accent" />
                    <h3 className="text-lg font-semibold">Attachments</h3>
                  </div>
                  <div className="space-y-3">
                    {prompt.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex flex-col gap-3 rounded-2xl border border-line/60 bg-background/60 px-4 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{attachment.originalName}</p>
                          <p className="mt-1 text-sm text-muted">
                            {attachment.contentType} · {formatFileSize(attachment.sizeBytes)}
                          </p>
                        </div>
                        <a
                          href={attachment.downloadUrl}
                          download={attachment.originalName}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-line/70 px-4 py-2 text-sm font-medium transition hover:border-accent/60 hover:text-accent"
                        >
                          <Download className="h-4 w-4" />
                          Download file
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
