"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import {
  useCallback,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { PDFLinkForm } from "@/components/library/PDFLinkForm";
import { importBookFromFile } from "@/lib/book-import";
import type { BookSummary } from "@/types/book";

interface UploadZoneProps {
  onUploaded: (book: BookSummary) => void;
  onError: (message: string) => void;
}

export function UploadZone({ onUploaded, onError }: UploadZoneProps) {
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
        onUploaded(await importBookFromFile(file));
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

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
      <label
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`group flex min-h-52 cursor-pointer flex-col items-center justify-center border-b border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] hover:border-[var(--accent)]"
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

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          or fetch from the web
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <PDFLinkForm onUploaded={onUploaded} onError={onError} />
      </div>
    </div>
  );
}
