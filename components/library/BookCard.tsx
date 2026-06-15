"use client";

import {
  Bookmark,
  GraduationCap,
  MoreHorizontal,
  Play,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getReadingProgress } from "@/lib/reading-progress";
import type { BookSummary } from "@/types/book";
import { Modal } from "@/components/ui/Modal";

interface BookCardProps {
  book: BookSummary;
  onDelete: (book: BookSummary) => Promise<void>;
}

function formatStarted(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function BookCard({ book, onDelete }: BookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progress = useMemo(() => getReadingProgress(book.id), [book.id]);
  const currentPage = Math.min(progress.currentPage, book.totalPages);
  const percentage = Math.round((currentPage / book.totalPages) * 100);

  const confirmDelete = async () => {
    setDeleting(true);
    await onDelete(book);
    setDeleting(false);
    setMenuOpen(false);
  };

  return (
    <>
      <article className="group min-w-0">
        <div className="relative aspect-[3/4.15] overflow-hidden rounded-[18px] bg-[#dfd7c8] shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:rounded-[22px]">
          {book.coverDataUrl ? (
            <Image
              src={book.coverDataUrl}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col justify-between bg-[#315747] p-4 text-[#f8f0e2]">
              <Bookmark size={22} />
              <p className="line-clamp-4 font-serif text-xl leading-tight">
                {book.title}
              </p>
              <span className="text-[10px] uppercase tracking-[0.24em] opacity-70">
                Folio edition
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/35">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
            aria-label={`Options for ${book.title}`}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="px-0.5 pt-3">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
              {book.title}
            </h3>
            {book.purpose === "study" ? (
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                title="Study Desk"
              >
                <GraduationCap size={13} />
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11px] text-[var(--muted)] sm:text-xs">
            Page {currentPage} of {book.totalPages}
          </p>
          <p className="mt-1 hidden truncate text-xs text-[var(--muted)] sm:block">
            Started {formatStarted(progress.dateStarted)} · {progress.sessions}{" "}
            {progress.sessions === 1 ? "session" : "sessions"}
          </p>
          <Link
            href={`/reader/${book.id}`}
            className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--text)] px-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-85 sm:text-sm"
          >
            {book.purpose === "study" ? (
              <GraduationCap size={16} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            {book.purpose === "study"
              ? "Open Study Desk"
              : currentPage > 1
                ? "Continue"
                : "Start reading"}
          </Link>
        </div>
      </article>

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Book options"
      >
        <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
          <p className="font-semibold">{book.title}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {book.totalPages} pages · {percentage}% complete
          </p>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={() => void confirmDelete()}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 font-semibold text-red-600 transition hover:bg-red-500/15 disabled:opacity-50"
        >
          <Trash2 size={18} />
          {deleting ? "Removing..." : "Remove from library"}
        </button>
      </Modal>
    </>
  );
}
