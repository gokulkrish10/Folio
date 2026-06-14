"use client";

import { useCallback, useState } from "react";
import {
  getReadingProgress,
  recordPageRead,
  recordReaderSession,
  toggleStoredBookmark,
} from "@/lib/reading-progress";

export function useReadingProgress(bookId: string) {
  const [progress, setProgress] = useState(() => getReadingProgress(bookId));

  const startSession = useCallback(() => {
    setProgress(recordReaderSession(bookId));
  }, [bookId]);

  const savePage = useCallback(
    (page: number) => {
      setProgress(recordPageRead(bookId, page));
    },
    [bookId],
  );

  const toggleBookmark = useCallback(
    (page: number) => {
      const next = toggleStoredBookmark(bookId, page);
      setProgress(next);
      return next;
    },
    [bookId],
  );

  return { progress, startSession, savePage, toggleBookmark };
}
