"use client";

import { nanoid } from "nanoid";
import { createCoverDataUrl, loadPDF } from "@/lib/pdf-engine";
import type { BookRecord } from "@/types/book";

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function createBookFromFile(file: File): Promise<BookRecord> {
  const pdfData = await file.arrayBuffer();
  const document = await loadPDF(pdfData);

  try {
    const metadata = await document.getMetadata().catch(() => null);
    const info = metadata?.info as { Title?: string } | undefined;
    const metadataTitle = info?.Title?.replace(/\0/g, "").trim();
    const coverDataUrl = await createCoverDataUrl(document);

    return {
      id: nanoid(12),
      title: metadataTitle || titleFromFilename(file.name) || "Untitled book",
      totalPages: document.numPages,
      pdfData,
      coverDataUrl,
      fileSize: file.size,
      addedAt: new Date().toISOString(),
    };
  } finally {
    await document.cleanup();
  }
}
