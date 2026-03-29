export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const allowedAttachmentExtensions = [
  "csv",
  "json",
  "md",
  "pdf",
  "text",
  "txt",
  "yaml",
  "yml",
  "xml",
] as const;

const allowedAttachmentExtensionSet = new Set<string>(allowedAttachmentExtensions);

export function getAttachmentExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedAttachmentExtension(fileName: string) {
  return allowedAttachmentExtensionSet.has(getAttachmentExtension(fileName));
}

export function getAllowedAttachmentExtensions() {
  return [...allowedAttachmentExtensionSet].sort();
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
