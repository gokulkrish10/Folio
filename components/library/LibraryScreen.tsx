"use client";

import { BookOpenText, CheckCircle2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BookCard } from "@/components/library/BookCard";
import { EmptyState } from "@/components/library/EmptyState";
import { UploadZone } from "@/components/library/UploadZone";
import {
  deleteBook,
  getBookSummaries,
} from "@/lib/storage";
import { removeReadingProgress } from "@/lib/reading-progress";
import type { BookSummary } from "@/types/book";

interface Notice {
  type: "success" | "error";
  message: string;
}

export function LibraryScreen() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    getBookSummaries()
      .then(setBooks)
      .catch(() =>
        setNotice({
          type: "error",
          message: "Your library could not be opened on this device.",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const onUploaded = useCallback((book: BookSummary) => {
    setBooks((current) => [book, ...current]);
    setNotice({ type: "success", message: `${book.title} added to Folio.` });
  }, []);

  const onError = useCallback((message: string) => {
    setNotice({ type: "error", message });
  }, []);

  const onDelete = async (book: BookSummary) => {
    await deleteBook(book.id);
    removeReadingProgress(book.id);
    setBooks((current) => current.filter((item) => item.id !== book.id));
    setNotice({ type: "success", message: `${book.title} was removed.` });
  };

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--bg)]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#2f5548] text-[#fff8ea] shadow-sm">
              <BookOpenText size={21} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">
                Folio
              </h1>
              <p className="hidden text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
                Your private library
              </p>
            </div>
          </div>
          <UploadZone
            compact
            onUploaded={onUploaded}
            onError={onError}
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[3/4.15] rounded-[22px] bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-4/5 rounded bg-[var(--surface-muted)]" />
                <div className="mt-2 h-3 w-2/5 rounded bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div>
            <EmptyState />
            <div className="mx-auto mt-10 max-w-xl">
              <UploadZone onUploaded={onUploaded} onError={onError} />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Library</p>
                <h2 className="mt-1 font-serif text-3xl font-medium sm:text-4xl">
                  Your books
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {books.length} {books.length === 1 ? "title" : "titles"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-11 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onDelete={onDelete} />
              ))}
            </div>
          </>
        )}
      </div>

      {notice ? (
        <div className="fixed inset-x-3 bottom-4 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#1d1b18] px-4 py-3 text-sm text-white shadow-2xl">
          {notice.type === "success" ? (
            <CheckCircle2 className="text-emerald-400" size={19} />
          ) : (
            <XCircle className="text-red-400" size={19} />
          )}
          <p className="min-w-0 flex-1">{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="grid size-10 place-items-center"
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      ) : null}
    </main>
  );
}
