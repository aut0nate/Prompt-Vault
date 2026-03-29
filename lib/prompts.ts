import { Prisma, PromptType } from "@prisma/client";

import { mapAttachmentRecord } from "@/lib/attachments";
import { prisma } from "@/lib/prisma";
import { promptQuerySchema } from "@/lib/validation";
import type {
  PromptCardRecord,
  PromptDetailRecord,
  PromptEditorSuggestions,
  PromptListResult,
  PromptQueryState,
} from "@/lib/types";
import { normaliseTagName, slugify } from "@/lib/utils";

const HOMEPAGE_TAG_LIMIT = 20;
const HOMEPAGE_CATEGORY_LIMIT = 20;
const EDITOR_SUGGESTION_LIMIT = 24;

function cleanTagNames(values: string[]) {
  return Array.from(new Set(values.map(normaliseTagName).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

const promptSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  type: true,
  isFavourite: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.PromptSelect;

const promptDetailSelect = {
  ...promptSelect,
  contentMarkdown: true,
  attachments: {
    select: {
      id: true,
      fileName: true,
      originalName: true,
      contentType: true,
      sizeBytes: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.PromptSelect;

function mapPrompt(
  record: Prisma.PromptGetPayload<{ select: typeof promptSelect }>,
  isAdmin: boolean,
): PromptCardRecord {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    category: record.category,
    type: record.type.toLowerCase() as PromptCardRecord["type"],
    isFavourite: isAdmin ? record.isFavourite : false,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    tags: cleanTagNames(record.tags.map(({ tag }) => tag.name)),
  };
}

function mapPromptDetail(
  record: Prisma.PromptGetPayload<{ select: typeof promptDetailSelect }>,
  isAdmin: boolean,
): PromptDetailRecord {
  return {
    ...mapPrompt(record, isAdmin),
    contentMarkdown: record.contentMarkdown,
    attachments: record.attachments.map(mapAttachmentRecord),
  };
}

function buildPromptWhere(query: PromptQueryState, isAdmin: boolean): Prisma.PromptWhereInput {
  const tagSlugs = query.tags.map((tag) => slugify(normaliseTagName(tag))).filter(Boolean);

  return {
    ...(query.type !== "all" ? { type: query.type.toUpperCase() as PromptType } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.favouritesOnly && isAdmin ? { isFavourite: true } : {}),
    ...(tagSlugs.length
      ? {
          tags: {
            some: {
              tag: {
                slug: {
                  in: tagSlugs,
                },
              },
            },
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search } },
            { summary: { contains: query.search } },
            { contentMarkdown: { contains: query.search } },
            { category: { contains: query.search } },
            {
              tags: {
                some: {
                  tag: {
                    OR: [
                      { name: { contains: query.search } },
                      { slug: { contains: slugify(query.search) } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

export async function ensureUniquePromptSlug(title: string, excludeId?: string) {
  const baseSlug = slugify(title) || "prompt";
  let candidateSlug = baseSlug;
  let suffix = 1;

  while (true) {
    const existingPrompt = await prisma.prompt.findFirst({
      where: {
        slug: candidateSlug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existingPrompt) {
      return candidateSlug;
    }

    suffix += 1;
    candidateSlug = `${baseSlug}-${suffix}`;
  }
}

export function parsePromptQuery(input: Record<string, string | string[] | undefined>, isAdmin = false) {
  const parsed = promptQuerySchema.parse({
    search: typeof input.search === "string" ? input.search : "",
    type: typeof input.type === "string" ? input.type : undefined,
    sort: typeof input.sort === "string" ? input.sort : undefined,
    category: typeof input.category === "string" ? input.category : "",
    tags: typeof input.tags === "string" ? input.tags : "",
    favourites: typeof input.favourites === "string" ? input.favourites : undefined,
    limit: typeof input.limit === "string" ? input.limit : undefined,
    cursor: typeof input.cursor === "string" ? input.cursor : undefined,
  });

  return {
    search: parsed.search,
    type: parsed.type,
    sort: parsed.sort,
    category: parsed.category,
    tags: parsed.tags,
    favouritesOnly: isAdmin ? parsed.favourites : false,
    limit: parsed.limit,
    cursor: parsed.cursor,
  };
}

export async function getPromptList(
  input: Record<string, string | string[] | undefined>,
  isAdmin = false,
): Promise<PromptListResult> {
  const query = parsePromptQuery(input, isAdmin);
  const where = buildPromptWhere(query, isAdmin);
  const direction = query.sort === "oldest" ? "asc" : "desc";

  const [prompts, totalCount, tags, categories] = await Promise.all([
    prisma.prompt.findMany({
      where,
      select: promptSelect,
      orderBy: [{ createdAt: direction }, { id: direction }],
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      take: query.limit + 1,
    }),
    prisma.prompt.count({ where }),
    prisma.tag.findMany({
      select: {
        name: true,
      },
      where: {
        prompts: {
          some: {},
        },
        name: {
          not: "",
        },
      },
      orderBy: [{ prompts: { _count: "desc" } }, { name: "asc" }],
      take: HOMEPAGE_TAG_LIMIT,
    }),
    prisma.prompt.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
      take: HOMEPAGE_CATEGORY_LIMIT,
    }),
  ]);

  const hasMore = prompts.length > query.limit;
  const sliced = hasMore ? prompts.slice(0, query.limit) : prompts;

  return {
    items: sliced.map((prompt) => mapPrompt(prompt, isAdmin)),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
    totalCount,
    availableTags: cleanTagNames(tags.map((tag) => tag.name)),
    availableCategories: categories.map((entry) => entry.category),
  };
}

export async function getPromptBySlug(slug: string, isAdmin = false) {
  const prompt = await prisma.prompt.findUnique({
    where: { slug },
    select: promptDetailSelect,
  });

  return prompt ? mapPromptDetail(prompt, isAdmin) : null;
}

export async function getPromptById(id: string, isAdmin = true) {
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: promptDetailSelect,
  });

  return prompt ? mapPromptDetail(prompt, isAdmin) : null;
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function getPromptEditorSuggestions(): Promise<PromptEditorSuggestions> {
  const [categories, tags] = await Promise.all([
    prisma.prompt.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
      orderBy: [{ _count: { category: "desc" } }, { category: "asc" }],
      take: EDITOR_SUGGESTION_LIMIT,
    }),
    prisma.tag.findMany({
      select: {
        name: true,
      },
      where: {
        prompts: {
          some: {},
        },
        name: {
          not: "",
        },
      },
      orderBy: [{ prompts: { _count: "desc" } }, { name: "asc" }],
      take: EDITOR_SUGGESTION_LIMIT,
    }),
  ]);

  return {
    categories: categories.map((entry) => entry.category),
    tags: cleanTagNames(tags.map((entry) => entry.name)),
  };
}
