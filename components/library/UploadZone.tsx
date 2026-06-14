"use client";

import { FileUp, LoaderCircle, Plus } from "lucide-react";
import {
  useCallback,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { createBookFromFile } from "@/lib/book-metadata";
import { saveBook } from "@/lib/storage";
import type { BookSummary } from "@/types/book";

interface UploadZoneProps {
  onUploaded: (book: BookSummary) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export function UploadZone({
  onUploaded,
  onError,
  compact = false,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const processFile = useCallback(
    async (file?: File) => {
      if (!file || uploading) return;
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        onError("Please choose a PDF file.");
        return;
      }

      setUploading(true);
      try {
        const book = await createBookFromFile(file);
        await saveBook(book);
        const { pdfData: _pdfData, ...summary } = book;
        onUploaded(summary);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The PDF could not be read.";
        onError(message);
      } finally {
        setUploading(false);
      }
    },
    [onError, onUploaded, uploading],
  );

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  };

  if (compact) {
    return (
      <label className="button-primary cursor-pointer">
        {uploading ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <Plus size={18} strokeWidth={2.3} />
        )}
        <span className="hidden sm:inline">
          {uploading ? "Importing..." : "Add book"}
        </span>
        <span className="sm:hidden">{uploading ? "Adding..." : "Add"}</span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          disabled={uploading}
          onChange={onChange}
        />
      </label>
    );
  }

  return (
    <label
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-10 text-center transition ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
      }`}
    >
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] transition group-hover:-translate-y-1">
        {uploading ? (
          <LoaderCircle className="animate-spin" size={25} />
        ) : (
          <FileUp size={25} />
        )}
      </span>
      <strong className="text-base">
        {uploading ? "Preparing your book..." : "Drop a PDF here"}
      </strong>
      <span className="mt-2 text-sm text-[var(--muted)]">
        {uploading
          ? "Extracting the cover, title, and page count"
          : "or tap to browse your files"}
      </span>
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        disabled={uploading}
        onChange={onChange}
      />
    </label>
  );
}
