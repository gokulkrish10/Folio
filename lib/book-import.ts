"use client";

import { createBookFromFile } from "@/lib/book-metadata";
import { saveBook } from "@/lib/storage";
import type { BookRecord, BookSummary } from "@/types/book";

const PDF_MIME_TYPE = "application/pdf";

function toSummary(book: BookRecord): BookSummary {
  const { pdfData: _pdfData, ...summary } = book;
  return summary;
}

function filenameFromUrl(value: string) {
  try {
    const url = new URL(value);
    const segment = decodeURIComponent(url.pathname.split("/").pop() || "");
    const cleaned = segment.replace(/[^\w\s().-]/g, "").trim();
    return cleaned.toLowerCase().endsWith(".pdf")
      ? cleaned
      : `${cleaned || "online-book"}.pdf`;
  } catch {
    return "online-book.pdf";
  }
}

export async function importBookFromFile(file: File): Promise<BookSummary> {
  if (file.type !== PDF_MIME_TYPE && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please choose a PDF file.");
  }

  const book = await createBookFromFile(file);
  await saveBook(book);
  return toSummary(book);
}

export async function importBookFromUrl(value: string): Promise<BookSummary> {
  const url = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid PDF link.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("The PDF link must start with http:// or https://.");
  }

  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: parsed.toString() }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || "The PDF could not be downloaded.");
  }

  const pdfData = await response.arrayBuffer();
  const file = new File([pdfData], filenameFromUrl(parsed.toString()), {
    type: PDF_MIME_TYPE,
  });
  return importBookFromFile(file);
}
