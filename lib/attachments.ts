import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  MAX_ATTACHMENT_SIZE_BYTES,
  getAttachmentExtension,
  isAllowedAttachmentExtension,
} from "@/lib/attachment-config";
import type { PromptAttachmentRecord } from "@/lib/types";
const attachmentsRoot = path.join(process.cwd(), "storage", "prompt-attachments");

function normaliseBaseName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function ensureAttachmentsDirectory() {
  await mkdir(attachmentsRoot, { recursive: true });
}

export async function persistAttachmentFile(file: File) {
  const originalName = file.name.trim();

  if (!originalName) {
    throw new Error("Each attachment needs a file name.");
  }

  if (!isAllowedAttachmentExtension(originalName)) {
    throw new Error("Attachments must use a safe file type such as TXT, CSV, PDF, JSON, or YAML.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Each attachment must be 5 MB or smaller.");
  }

  await ensureAttachmentsDirectory();

  const extension = getAttachmentExtension(originalName);
  const baseName = normaliseBaseName(path.basename(originalName, path.extname(originalName))) || "attachment";
  const fileName = `${baseName}-${randomUUID()}.${extension}`;
  const storagePath = path.join(attachmentsRoot, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(storagePath, buffer);

  return {
    fileName,
    originalName,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storagePath: fileName,
  };
}

export async function deleteStoredAttachment(storagePath: string) {
  const filePath = path.join(attachmentsRoot, storagePath);
  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

export async function readStoredAttachment(storagePath: string) {
  const filePath = path.join(attachmentsRoot, storagePath);
  const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);

  return {
    buffer,
    sizeBytes: fileStat.size,
  };
}

export async function deletePromptAttachmentDirectoryIfEmpty() {
  await readdir(attachmentsRoot)
    .then(async (entries) => {
      if (entries.length === 0) {
        await rm(attachmentsRoot, { recursive: true, force: true });
      }
    })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
}

export function mapAttachmentRecord(attachment: {
  id: string;
  fileName: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}): PromptAttachmentRecord {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    originalName: attachment.originalName,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    downloadUrl: `/api/prompt-attachments/${attachment.id}`,
  };
}
