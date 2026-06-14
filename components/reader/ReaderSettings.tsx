"use client";

import { Bookmark, ChevronRight, ListTree, Timer } from "lucide-react";
import { ThemeSelector } from "@/components/reader/ThemeSelector";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface ReaderSettingsProps {
  open: boolean;
  onClose: () => void;
  bookmarkCount: number;
  hasContents: boolean;
  pagesRead: number;
  sessions: number;
  onOpenBookmarks: () => void;
  onOpenContents: () => void;
}

export function ReaderSettings({
  open,
  onClose,
  bookmarkCount,
  hasContents,
  pagesRead,
  sessions,
  onOpenBookmarks,
  onOpenContents,
}: ReaderSettingsProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Reading settings">
      <p className="eyebrow mb-3">Appearance</p>
      <ThemeSelector />

      <p className="eyebrow mb-3 mt-7">Navigate</p>
      <div className="overflow-hidden rounded-2xl bg-[var(--surface-muted)]">
        <button
          type="button"
          onClick={onOpenBookmarks}
          className="flex min-h-16 w-full items-center gap-3 border-b border-[var(--border)] px-4 text-left transition hover:opacity-75"
        >
          <Bookmark size={19} className="text-[var(--accent-strong)]" />
          <span className="flex-1 font-medium">Bookmarks</span>
          <span className="text-xs text-[var(--muted)]">{bookmarkCount}</span>
          <ChevronRight size={17} className="text-[var(--muted)]" />
        </button>
        <button
          type="button"
          onClick={onOpenContents}
          disabled={!hasContents}
          className="flex min-h-16 w-full items-center gap-3 px-4 text-left transition hover:opacity-75 disabled:opacity-40"
        >
          <ListTree size={19} className="text-[var(--accent-strong)]" />
          <span className="flex-1 font-medium">Contents</span>
          {!hasContents ? (
            <span className="text-xs text-[var(--muted)]">Unavailable</span>
          ) : null}
          <ChevronRight size={17} className="text-[var(--muted)]" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 text-sm">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Timer size={19} />
        </span>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--text)]">{pagesRead}</strong> unique
          pages read across{" "}
          <strong className="text-[var(--text)]">{sessions}</strong>{" "}
          {sessions === 1 ? "session" : "sessions"}.
        </p>
      </div>
    </BottomSheet>
  );
}
