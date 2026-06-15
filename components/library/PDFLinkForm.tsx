"use client";

import { Download, Link2, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { importBookFromUrl } from "@/lib/book-import";
import type { BookPurpose, BookSummary } from "@/types/book";

interface PDFLinkFormProps {
  onUploaded: (book: BookSummary) => void;
  onError: (message: string) => void;
  onComplete?: () => void;
  purpose?: BookPurpose;
}

export function PDFLinkForm({
  onUploaded,
  onError,
  onComplete,
  purpose = "read",
}: PDFLinkFormProps) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim() || importing) return;

    setImporting(true);
    try {
      const book = await importBookFromUrl(url, purpose);
      onUploaded(book);
      setUrl("");
      onComplete?.();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "The PDF could not be fetched.",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <label
        htmlFor="pdf-link"
        className="mb-2 block text-sm font-semibold"
      >
        Direct PDF link
      </label>
      <div className="relative">
        <Link2
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          size={19}
        />
        <input
          id="pdf-link"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/book.pdf"
          disabled={importing}
          className="min-h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] py-3 pl-12 pr-4 text-sm placeholder:text-[var(--muted)]/75"
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
        Use a public link that opens the PDF itself, not a webpage or sign-in
        screen.
      </p>
      <button
        type="submit"
        disabled={!url.trim() || importing}
        className="button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        {importing ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <Download size={18} />
        )}
        {importing ? "Fetching PDF..." : "Import from link"}
      </button>
    </form>
  );
}
