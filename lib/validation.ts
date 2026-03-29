import { z } from "zod";

import { splitTags } from "@/lib/utils";

const promptTypes = ["TEXT", "IMAGE", "VIDEO", "AUDIO"] as const;

export const promptFormSchema = z.object({
  title: z.string().trim().min(3, "Please add a title with at least 3 characters.").max(120),
  summary: z
    .string()
    .trim()
    .min(12, "Please add a short summary so the card preview is useful.")
    .max(220),
  contentMarkdown: z
    .string()
    .trim()
    .min(20, "Please add the full prompt content.")
    .max(20000),
  category: z.string().trim().min(2, "Please add a category.").max(60),
  type: z.enum(promptTypes, { message: "Please choose a prompt type." }),
  tags: z
    .string()
    .transform(splitTags)
    .refine((tags) => tags.length > 0, "Please add at least one tag.")
    .refine((tags) => tags.length <= 12, "Please keep tags to 12 or fewer."),
});

export const promptQuerySchema = z.object({
  search: z.string().trim().default(""),
  type: z.enum(["all", "text", "image", "video", "audio"]).default("all"),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  category: z.string().trim().default(""),
  tags: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  favourites: z
    .string()
    .optional()
    .transform((value) => value === "1"),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  cursor: z.string().trim().optional(),
});
