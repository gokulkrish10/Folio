"use client";

import { ChevronRight, ListTree } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { TocItem } from "@/types/book";

interface TOCPanelProps {
  open: boolean;
  onClose: () => void;
  items: TocItem[];
  onSelect: (page: number) => void;
}

function TocRows({
  items,
  depth = 0,
  onSelect,
  onClose,
}: {
  items: TocItem[];
  depth?: number;
  onSelect: (page: number) => void;
  onClose: () => void;
}) {
  return items.map((item, index) => (
    <div key={`${item.title}-${index}`}>
      <button
        type="button"
        disabled={item.pageNumber === null}
        onClick={() => {
          if (item.pageNumber === null) return;
          onSelect(item.pageNumber);
          onClose();
        }}
        className="flex min-h-14 w-full items-center gap-3 border-b border-[var(--border)] text-left transition hover:bg-[var(--surface-muted)] disabled:opacity-45"
        style={{ paddingLeft: `${Math.min(depth, 3) * 18 + 8}px` }}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {item.title}
        </span>
        {item.pageNumber ? (
          <span className="text-xs text-[var(--muted)]">
            {item.pageNumber}
          </span>
        ) : null}
        <ChevronRight size={16} className="text-[var(--muted)]" />
      </button>
      {item.items.length ? (
        <TocRows
          items={item.items}
          depth={depth + 1}
          onSelect={onSelect}
          onClose={onClose}
        />
      ) : null}
    </div>
  ));
}

export function TOCPanel({
  open,
  onClose,
  items,
  onSelect,
}: TOCPanelProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Contents">
      {items.length ? (
        <TocRows items={items} onSelect={onSelect} onClose={onClose} />
      ) : (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <ListTree
              className="mx-auto text-[var(--accent-strong)]"
              size={32}
            />
            <p className="mt-4 font-semibold">No table of contents</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              This PDF does not include a chapter outline.
            </p>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
