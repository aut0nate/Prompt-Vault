"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Image, Mic2, Star, Type, Video } from "lucide-react";

import type { PromptCardRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type PromptCardProps = {
  prompt: PromptCardRecord;
  onOpen: (slug: string) => void;
};

export function PromptCard({ prompt, onOpen }: PromptCardProps) {
  const typeStyles = {
    text: { icon: Type, label: "Text", className: "bg-[#d9efdf] text-[#245438] dark:bg-[#19382a] dark:text-[#9addb2]" },
    image: { icon: Image, label: "Image", className: "bg-[#f8dfc8] text-[#70401d] dark:bg-[#482a19] dark:text-[#f3bc8c]" },
    video: { icon: Video, label: "Video", className: "bg-[#dce7fa] text-[#284a76] dark:bg-[#1d304a] dark:text-[#a9c7f2]" },
    audio: { icon: Mic2, label: "Audio", className: "bg-[#eee0f3] text-[#5d386c] dark:bg-[#392342] dark:text-[#dcb2e9]" },
  } as const;
  const typeStyle = typeStyles[prompt.type.toLowerCase() as keyof typeof typeStyles] ?? typeStyles.text;
  const TypeIcon = typeStyle.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(prompt.slug)}
      data-testid="prompt-card"
      className={cn(
        "prompt-card group relative flex h-full min-h-[23rem] flex-col overflow-hidden rounded-[1.35rem] border border-line/60 bg-panel/80 p-5 text-left shadow-[0_12px_35px_rgba(37,31,25,0.045)] transition duration-300 hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_20px_50px_rgba(37,31,25,0.11)] md:p-6",
        prompt.isFavourite && "border-accent/50 bg-accentSoft/40",
      )}
    >
      <div className="mb-7 flex items-center justify-between gap-4">
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold", typeStyle.className)}>
          <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {typeStyle.label}
        </span>
        {prompt.isFavourite ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Star className="h-3.5 w-3.5 fill-current" />
            Saved
          </span>
        ) : null}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{prompt.category}</p>
      <h3 className="font-display max-w-[22rem] text-[1.65rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground">
        {prompt.title}
      </h3>
      <p className="mb-6 mt-3 line-clamp-2 text-sm leading-6 text-foreground/66">{prompt.summary}</p>

      <div
        data-testid="prompt-card-preview"
        className="prompt-preview mb-6 border-l-2 border-accent/45 pl-4 font-mono text-[12px] leading-6 text-foreground/62"
      >
        <div className="line-clamp-3 whitespace-pre-wrap">{prompt.previewSnippet}</div>
      </div>

      <div className="mt-auto">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground/60"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line/45 pt-4 text-xs font-medium text-muted">
          <span>{formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}</span>
          <span className="inline-flex items-center gap-2 font-bold text-foreground transition group-hover:text-accent">
            Use prompt
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
