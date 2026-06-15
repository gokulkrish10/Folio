"use client";

import {
  BookOpen,
  Check,
  FileUp,
  GraduationCap,
  Link2,
  Plus,
} from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { PDFLinkForm } from "@/components/library/PDFLinkForm";
import { Modal } from "@/components/ui/Modal";
import { importBookFromFile } from "@/lib/book-import";
import type { BookPurpose, BookSummary } from "@/types/book";

interface AddBookDialogProps {
  onUploaded: (book: BookSummary) => void;
  onError: (message: string) => void;
}

export function AddBookDialog({
  onUploaded,
  onError,
}: AddBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [purpose, setPurpose] = useState<BookPurpose>("read");

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;

    setUploading(true);
    try {
      onUploaded(await importBookFromFile(file, purpose));
      setOpen(false);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "The PDF could not be read.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="button-primary"
      >
        <Plus size={18} strokeWidth={2.3} />
        <span className="hidden sm:inline">Add book</span>
        <span className="sm:hidden">Add</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a book">
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[
            {
              id: "read" as const,
              label: "Reading",
              detail: "Clean, calm reader",
              icon: BookOpen,
            },
            {
              id: "study" as const,
              label: "Study Desk",
              detail: "Search, mark, note",
              icon: GraduationCap,
            },
          ].map((option) => {
            const Icon = option.icon;
            const selected = purpose === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPurpose(option.id)}
                className={`relative min-h-24 rounded-2xl border p-3 text-left transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)]"
                }`}
                aria-pressed={selected}
              >
                <Icon size={20} className="text-[var(--accent-strong)]" />
                <strong className="mt-3 block text-sm">{option.label}</strong>
                <span className="mt-1 block text-[11px] text-[var(--muted)]">
                  {option.detail}
                </span>
                {selected ? (
                  <Check
                    size={15}
                    className="absolute right-3 top-3 text-[var(--accent-strong)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <FileUp size={20} />
          </span>
          <span className="min-w-0">
            <strong className="block text-sm">
              {uploading ? "Preparing your book..." : "Upload a PDF"}
            </strong>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Choose a file from this device
            </span>
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => void onFile(event)}
          />
        </label>

        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          or paste a link
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent-strong)]">
            <Link2 size={17} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">
              From the web
            </span>
          </div>
          <PDFLinkForm
            onUploaded={onUploaded}
            onError={onError}
            onComplete={() => setOpen(false)}
            purpose={purpose}
          />
        </div>
      </Modal>
    </>
  );
}
