"use client";

import type { Bookmark, ReadingProgress, ReaderTheme } from "@/types/book";

const PROGRESS_PREFIX = "folio:progress:";
const THEME_KEY = "folio:theme";

function storageAvailable() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function newProgress(): ReadingProgress {
  const now = new Date().toISOString();
  return {
    currentPage: 1,
    bookmarks: [],
    dateStarted: now,
    lastReadAt: now,
    pagesRead: [],
    sessions: 0,
  };
}

export function getReadingProgress(bookId: string): ReadingProgress {
  if (!storageAvailable()) return newProgress();

  try {
    const value = window.localStorage.getItem(`${PROGRESS_PREFIX}${bookId}`);
    if (!value) return newProgress();
    const parsed = JSON.parse(value) as Partial<ReadingProgress>;
    const fallback = newProgress();

    return {
      ...fallback,
      ...parsed,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      pagesRead: Array.isArray(parsed.pagesRead) ? parsed.pagesRead : [],
    };
  } catch {
    return newProgress();
  }
}

export function saveReadingProgress(
  bookId: string,
  progress: ReadingProgress,
): void {
  if (!storageAvailable()) return;
  window.localStorage.setItem(
    `${PROGRESS_PREFIX}${bookId}`,
    JSON.stringify(progress),
  );
}

export function recordPageRead(
  bookId: string,
  page: number,
): ReadingProgress {
  const progress = getReadingProgress(bookId);
  const updated: ReadingProgress = {
    ...progress,
    currentPage: page,
    lastReadAt: new Date().toISOString(),
    pagesRead: progress.pagesRead.includes(page)
      ? progress.pagesRead
      : [...progress.pagesRead, page],
  };
  saveReadingProgress(bookId, updated);
  return updated;
}

export function recordReaderSession(bookId: string): ReadingProgress {
  const progress = getReadingProgress(bookId);
  const updated = { ...progress, sessions: progress.sessions + 1 };
  saveReadingProgress(bookId, updated);
  return updated;
}

export function toggleStoredBookmark(
  bookId: string,
  page: number,
): ReadingProgress {
  const progress = getReadingProgress(bookId);
  const exists = progress.bookmarks.some((bookmark) => bookmark.page === page);
  const bookmark: Bookmark = {
    page,
    createdAt: new Date().toISOString(),
  };
  const bookmarks = exists
    ? progress.bookmarks.filter((item) => item.page !== page)
    : [...progress.bookmarks, bookmark].sort((a, b) => a.page - b.page);
  const updated = { ...progress, bookmarks };
  saveReadingProgress(bookId, updated);
  return updated;
}

export function removeReadingProgress(bookId: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(`${PROGRESS_PREFIX}${bookId}`);
}

export function getStoredTheme(): ReaderTheme {
  if (!storageAvailable()) return "light";
  const theme = window.localStorage.getItem(THEME_KEY);
  return theme === "dark" || theme === "sepia" ? theme : "light";
}

export function saveStoredTheme(theme: ReaderTheme): void {
  if (!storageAvailable()) return;
  window.localStorage.setItem(THEME_KEY, theme);
}
