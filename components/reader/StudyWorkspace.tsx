"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChevronRight,
  FileWarning,
  GraduationCap,
  Highlighter,
  LoaderCircle,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchPDFText } from "@/lib/pdf-engine";
import type {
  Bookmark as BookmarkType,
  ReaderLayout,
  StudyData,
  StudySearchResult,
} from "@/types/book";

type StudyTab = "search" | "marks" | "notes";

interface StudyWorkspaceProps {
  open: boolean;
  title: string;
  document: PDFDocumentProxy;
  page: number;
  totalPages: number;
  layout: ReaderLayout;
  bookmarks: BookmarkType[];
  studyData: StudyData;
  onClose: () => void;
  onNavigate: (page: number) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onSaveNote: (page: number, text: string) => void;
  onUseReadableText: () => void;
}

function navigateResponsively(
  page: number,
  onNavigate: (page: number) => void,
  onClose: () => void,
) {
  onNavigate(page);
  if (window.matchMedia("(max-width: 1023px)").matches) onClose();
}

export function StudyWorkspace({
  open,
  title,
  document,
  page,
  totalPages,
  layout,
  bookmarks,
  studyData,
  onClose,
  onNavigate,
  onDeleteHighlight,
  onSaveNote,
  onUseReadableText,
}: StudyWorkspaceProps) {
  const [tab, setTab] = useState<StudyTab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scannedPages, setScannedPages] = useState(0);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const searchRun = useRef(0);
  const savedPageNote =
    studyData.notes.find((item) => item.page === page)?.text || "";
  const noteDraft = noteDrafts[page] ?? savedPageNote;
  const noteChanged = noteDraft.trim() !== savedPageNote;

  useEffect(() => {
    const normalized = query.trim();
    searchRun.current += 1;
    const run = searchRun.current;

    if (normalized.length < 2) return;
    const timer = window.setTimeout(() => {
      void searchPDFText(
        document,
        normalized,
        (completed, total) => {
          if (searchRun.current === run) {
            setProgress(Math.round((completed / total) * 100));
          }
        },
        () => searchRun.current === run,
      ).then((response) => {
        if (searchRun.current !== run) return;
        setResults(response.results);
        setScannedPages(response.scannedPages);
        setSearching(false);
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [document, query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    searchRun.current += 1;
    if (value.trim().length >= 2) {
      setSearching(true);
      setProgress(0);
      return;
    }
    setResults([]);
    setSearching(false);
    setProgress(0);
    setScannedPages(0);
  };

  const currentPageHighlights = studyData.highlights.filter(
    (highlight) => highlight.page === page,
  ).length;
  const currentPageBookmarked = bookmarks.some(
    (bookmark) => bookmark.page === page,
  );

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close Study Desk"
            className="fixed inset-0 z-[69] bg-black/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            aria-label="Study Desk"
            className="surface-panel fixed inset-x-0 bottom-0 z-[70] flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[30px] border-t border-[var(--border)] shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[390px] lg:rounded-none lg:border-l lg:border-t-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-current opacity-15 lg:hidden" />
            <header className="border-b border-[var(--border)] px-5 pb-4 pt-4 lg:pt-[max(20px,env(safe-area-inset-top))]">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#2f5548] text-[#fff8ea]">
                  <GraduationCap size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Study Desk
                  </p>
                  <h2 className="mt-0.5 truncate font-semibold">{title}</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Page {page} of {totalPages}
                    {currentPageBookmarked ? " · Bookmarked" : ""}
                    {currentPageHighlights
                      ? ` · ${currentPageHighlights} marked`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="icon-button"
                  aria-label="Close Study Desk"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            <nav className="grid grid-cols-3 border-b border-[var(--border)] px-3 pt-2">
              {[
                { id: "search" as const, label: "Search", icon: Search },
                { id: "marks" as const, label: "Marks", icon: Highlighter },
                { id: "notes" as const, label: "Notes", icon: StickyNote },
              ].map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`relative flex min-h-12 items-center justify-center gap-2 text-xs font-semibold transition ${
                      active
                        ? "text-[var(--accent-strong)]"
                        : "text-[var(--muted)]"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon size={16} />
                    {item.label}
                    {active ? (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent-strong)]" />
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
              {tab === "search" ? (
                <div>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      size={18}
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => updateQuery(event.target.value)}
                      placeholder="Search a topic, drug, condition..."
                      className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] pl-11 pr-4 text-sm"
                      aria-label="Search the entire textbook"
                    />
                  </div>

                  {searching ? (
                    <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center gap-3 text-sm">
                        <LoaderCircle
                          className="animate-spin text-[var(--accent-strong)]"
                          size={18}
                        />
                        <span className="flex-1">Reading the whole book</span>
                        <span className="text-xs text-[var(--muted)]">
                          {progress}%
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent-strong)] transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {!searching && query.trim().length >= 2 ? (
                    <p className="mb-3 mt-4 text-xs text-[var(--muted)]">
                      {results.length
                        ? `${results.length} relevant pages`
                        : "No matching text found"}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    {results.map((result) => (
                      <button
                        key={result.page}
                        type="button"
                        onClick={() =>
                          navigateResponsively(
                            result.page,
                            onNavigate,
                            onClose,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)]"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)]">
                          Page {result.page}
                          <span className="font-normal text-[var(--muted)]">
                            {result.occurrences} matches
                          </span>
                        </span>
                        <span className="mt-2 line-clamp-3 block text-sm leading-6">
                          {result.snippet}
                        </span>
                      </button>
                    ))}
                  </div>

                  {!searching &&
                  query.trim().length >= 2 &&
                  scannedPages > 0 ? (
                    <div className="mt-4 flex gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm">
                      <FileWarning
                        className="mt-0.5 shrink-0 text-amber-700"
                        size={18}
                      />
                      <p className="leading-5 text-[var(--muted)]">
                        {scannedPages} pages have no text layer. They remain
                        readable, but require OCR before their topics can be
                        searched.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {tab === "marks" ? (
                <div>
                  {layout !== "reflow" ? (
                    <button
                      type="button"
                      onClick={onUseReadableText}
                      className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-[var(--accent-soft)] p-4 text-left"
                    >
                      <Highlighter
                        className="text-[var(--accent-strong)]"
                        size={20}
                      />
                      <span className="flex-1">
                        <strong className="block text-sm">
                          Select and highlight text
                        </strong>
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                          Switch to readable text for precise marking.
                        </span>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onUseReadableText}
                      className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-[var(--accent-soft)] p-4 text-left"
                    >
                      <Highlighter
                        className="text-[var(--accent-strong)]"
                        size={20}
                      />
                      <span className="flex-1">
                        <strong className="block text-sm">
                          Start highlighting
                        </strong>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          Select any sentence, then choose a marker color.
                        </span>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  )}

                  {bookmarks.length ? (
                    <>
                      <p className="eyebrow mb-2">Bookmarks</p>
                      <div className="mb-5 flex flex-wrap gap-2">
                        {bookmarks.map((bookmark) => (
                          <button
                            key={bookmark.page}
                            type="button"
                            onClick={() =>
                              navigateResponsively(
                                bookmark.page,
                                onNavigate,
                                onClose,
                              )
                            }
                            className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--surface-muted)] px-3 text-xs font-semibold"
                          >
                            <Bookmark
                              size={14}
                              className="text-[var(--accent-strong)]"
                              fill="currentColor"
                            />
                            Page {bookmark.page}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <p className="eyebrow mb-2">Highlights</p>
                  {studyData.highlights.length ? (
                    <div className="space-y-2">
                      {studyData.highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="rounded-2xl border border-[var(--border)] p-4"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigateResponsively(
                                highlight.page,
                                onNavigate,
                                onClose,
                              )
                            }
                            className="w-full text-left"
                          >
                            <span className="text-xs font-semibold text-[var(--accent-strong)]">
                              Page {highlight.page}
                            </span>
                            <span className="mt-2 line-clamp-4 block text-sm leading-6">
                              “{highlight.quote}”
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteHighlight(highlight.id)
                            }
                            className="mt-2 flex min-h-9 items-center gap-1.5 text-xs text-red-600"
                            aria-label={`Delete highlight on page ${highlight.page}`}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-5 text-center text-sm text-[var(--muted)]">
                      Your key passages will collect here.
                    </div>
                  )}
                </div>
              ) : null}

              {tab === "notes" ? (
                <div>
                  <label className="block">
                    <span className="text-sm font-semibold">
                      Page {page} note
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      Capture a clinical link, definition, or exam reminder.
                    </span>
                    <textarea
                      value={noteDraft}
                      onChange={(event) =>
                        setNoteDrafts((current) => ({
                          ...current,
                          [page]: event.target.value,
                        }))
                      }
                      rows={6}
                      placeholder="What matters on this page?"
                      className="mt-3 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveNote(page, noteDraft);
                      setNoteDrafts((current) => {
                        const next = { ...current };
                        delete next[page];
                        return next;
                      });
                    }}
                    disabled={!noteChanged}
                    className="button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <StickyNote size={17} />
                    {noteDraft.trim()
                      ? "Save page note"
                      : savedPageNote
                        ? "Remove page note"
                        : "Write a note above"}
                  </button>

                  <p className="eyebrow mb-2 mt-7">Notebook</p>
                  {studyData.notes.length ? (
                    <div className="space-y-2">
                      {studyData.notes.map((note) => (
                        <button
                          key={note.page}
                          type="button"
                          onClick={() =>
                            navigateResponsively(note.page, onNavigate, onClose)
                          }
                          className="w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-left"
                        >
                          <span className="text-xs font-semibold text-[var(--accent-strong)]">
                            Page {note.page}
                          </span>
                          <span className="mt-2 line-clamp-4 block whitespace-pre-wrap text-sm leading-6">
                            {note.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-5 text-center text-sm text-[var(--muted)]">
                      Notes from every chapter will appear here.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
