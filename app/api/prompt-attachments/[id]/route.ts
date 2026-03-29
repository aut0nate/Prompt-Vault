import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readStoredAttachment } from "@/lib/attachments";

export const dynamic = "force-dynamic";

type PromptAttachmentRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: PromptAttachmentRouteProps) {
  const { id } = await params;
  const attachment = await prisma.promptAttachment.findUnique({
    where: { id },
    select: {
      originalName: true,
      contentType: true,
      sizeBytes: true,
      storagePath: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ message: "Attachment not found." }, { status: 404 });
  }

  try {
    const { buffer } = await readStoredAttachment(attachment.storagePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.contentType || "application/octet-stream",
        "Content-Length": String(attachment.sizeBytes),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Attachment file not found." }, { status: 404 });
  }
}
