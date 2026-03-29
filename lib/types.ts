export const promptTypes = ["all", "text", "image", "video", "audio"] as const;
export const promptSortOptions = ["newest", "oldest"] as const;

export type PromptTypeFilter = (typeof promptTypes)[number];
export type PromptSortOption = (typeof promptSortOptions)[number];

export type PromptCardRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: "text" | "image" | "video" | "audio";
  category: string;
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type PromptAttachmentRecord = {
  id: string;
  fileName: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
};

export type PromptDetailRecord = PromptCardRecord & {
  contentMarkdown: string;
  attachments: PromptAttachmentRecord[];
};

export type PromptQueryState = {
  search: string;
  type: PromptTypeFilter;
  sort: PromptSortOption;
  tags: string[];
  favouritesOnly: boolean;
};

export type PromptListResult = {
  items: PromptCardRecord[];
  nextCursor: string | null;
  totalCount: number;
  availableTags: string[];
};

export type PromptFormState = {
  success: boolean;
  message: string;
  redirectTo?: string;
  errors?: Partial<
    Record<"title" | "summary" | "contentMarkdown" | "category" | "tags" | "type" | "attachments", string>
  >;
};
