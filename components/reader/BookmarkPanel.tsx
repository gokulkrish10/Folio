"use client";

import { Bookmark, ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Bookmark as BookmarkType } from "@/types/book";

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  onSelect: (page: number) => void;
}

export function BookmarkPanel({
  open,
  onClose,
  bookmarks,
  onSelect,
}: BookmarkPanelProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Bookmarks">
      {bookmarks.length === 0 ? (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <Bookmark
              className="mx-auto text-[var(--accent-strong)]"
              size={32}
            />
            <p className="mt-4 font-semibold">No saved pages yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Tap the bookmark in the top bar while reading.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <button
              key={bookmark.page}
              type="button"
              onClick={() => {
                onSelect(bookmark.page);
                onClose();
              }}
              className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 text-left transition hover:opacity-80"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                <Bookmark size={17} fill="currentColor" />
              </span>
              <span className="flex-1 font-semibold">
                Page {bookmark.page}
              </span>
              <ChevronRight size={18} className="text-[var(--muted)]" />
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
