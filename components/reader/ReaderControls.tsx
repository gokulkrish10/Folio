"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { PageScrubber } from "@/components/reader/PageScrubber";

interface ReaderControlsProps {
  visible: boolean;
  title: string;
  page: number;
  totalPages: number;
  bookmarked: boolean;
  onBookmark: () => void;
  onMenu: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onJumpRequest: () => void;
  onPageChange: (page: number) => void;
  onActivity: () => void;
}

function remainingTime(page: number, totalPages: number) {
  const minutes = Math.max(0, totalPages - page) * 2;
  if (minutes < 60) return `${minutes} min left`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min left` : `${hours} hr left`;
}

export function ReaderControls({
  visible,
  title,
  page,
  totalPages,
  bookmarked,
  onBookmark,
  onMenu,
  onPrevious,
  onNext,
  onJumpRequest,
  onPageChange,
  onActivity,
}: ReaderControlsProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <>
          <motion.header
            className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#151515]/88 px-2 pb-2 pt-[max(8px,env(safe-area-inset-top))] text-white backdrop-blur-xl sm:px-4"
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={onActivity}
          >
            <div className="mx-auto flex h-12 max-w-6xl items-center gap-2">
              <Link href="/" className="reader-control-button" aria-label="Back to library">
                <ArrowLeft size={21} />
              </Link>
              <h1 className="min-w-0 flex-1 truncate px-1 text-sm font-medium sm:text-base">
                {title}
              </h1>
              <button
                type="button"
                onClick={onBookmark}
                className={`reader-control-button ${
                  bookmarked ? "text-[var(--accent)]" : ""
                }`}
                aria-label={
                  bookmarked ? "Remove page bookmark" : "Bookmark this page"
                }
                aria-pressed={bookmarked}
              >
                <Bookmark
                  size={20}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={onMenu}
                className="reader-control-button"
                aria-label="Reader settings"
              >
                <Menu size={21} />
              </button>
            </div>
          </motion.header>

          <motion.footer
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#151515]/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-white backdrop-blur-xl"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={onActivity}
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex items-center justify-between gap-4 text-xs">
                <button
                  type="button"
                  onClick={onJumpRequest}
                  className="min-h-11 rounded-xl px-2 font-semibold transition hover:bg-white/10"
                >
                  {page} <span className="text-white/45">/ {totalPages}</span>
                </button>
                <span className="text-white/55">
                  {remainingTime(page, totalPages)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onPrevious}
                  disabled={page <= 1}
                  className="reader-control-button disabled:opacity-25"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={23} />
                </button>
                <PageScrubber
                  page={page}
                  totalPages={totalPages}
                  onChange={onPageChange}
                />
                <button
                  type="button"
                  onClick={onNext}
                  disabled={page >= totalPages}
                  className="reader-control-button disabled:opacity-25"
                  aria-label="Next page"
                >
                  <ChevronRight size={23} />
                </button>
              </div>
            </div>
          </motion.footer>
        </>
      ) : null}
    </AnimatePresence>
  );
}
