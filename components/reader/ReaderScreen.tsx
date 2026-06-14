"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkPanel } from "@/components/reader/BookmarkPanel";
import { PageJumpModal } from "@/components/reader/PageJumpModal";
import { PDFCanvas } from "@/components/reader/PDFCanvas";
import { ReaderControls } from "@/components/reader/ReaderControls";
import { ReaderSettings } from "@/components/reader/ReaderSettings";
import { TOCPanel } from "@/components/reader/TOCPanel";
import { ZoomWrapper } from "@/components/reader/ZoomWrapper";
import { useReader } from "@/contexts/ReaderContext";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { usePDFRenderer } from "@/hooks/usePDFRenderer";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { getReadingProgress } from "@/lib/reading-progress";

interface ReaderScreenProps {
  bookId: string;
}

export function ReaderScreen({ bookId }: ReaderScreenProps) {
  const { state, dispatch } = useReader();
  const { book, document, outline, loading, error } = usePDFRenderer(bookId);
  const { progress, startSession, savePage, toggleBookmark } =
    useReadingProgress(bookId);
  const initializedRef = useRef(false);
  const [activity, setActivity] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);

  useEffect(() => {
    if (!book || initializedRef.current) return;
    initializedRef.current = true;
    const stored = getReadingProgress(book.id);
    dispatch({
      type: "LOAD",
      payload: {
        bookId: book.id,
        title: book.title,
        totalPages: book.totalPages,
        currentPage: Math.min(stored.currentPage, book.totalPages),
        bookmarks: stored.bookmarks,
      },
    });
    startSession();
  }, [book, dispatch, startSession]);

  useEffect(() => {
    if (!book || state.bookId !== book.id) return;
    savePage(state.currentPage);
  }, [book, savePage, state.bookId, state.currentPage]);

  const goToPage = useCallback(
    (page: number) => {
      dispatch({ type: "GO_TO_PAGE", page });
      setActivity(Date.now());
    },
    [dispatch],
  );

  const previous = useCallback(
    () => goToPage(state.currentPage - 1),
    [goToPage, state.currentPage],
  );
  const next = useCallback(
    () => goToPage(state.currentPage + 1),
    [goToPage, state.currentPage],
  );

  useKeyboardNavigation(previous, next, !settingsOpen && !jumpOpen);
  const swipeHandlers = useSwipeNavigation(previous, next);

  const anyPanelOpen =
    settingsOpen || bookmarksOpen || tocOpen || jumpOpen;

  useEffect(() => {
    if (!state.controlsVisible || anyPanelOpen) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "SET_CONTROLS", visible: false }),
      3000,
    );
    return () => window.clearTimeout(timer);
  }, [
    activity,
    anyPanelOpen,
    dispatch,
    state.controlsVisible,
    state.currentPage,
  ]);

  const wakeControls = useCallback(() => {
    dispatch({ type: "SET_CONTROLS", visible: true });
    setActivity(Date.now());
  }, [dispatch]);

  const toggleCurrentBookmark = () => {
    const updated = toggleBookmark(state.currentPage);
    dispatch({ type: "SET_BOOKMARKS", bookmarks: updated.bookmarks });
    wakeControls();
  };

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-6 text-center">
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <LoaderCircle className="animate-spin" size={28} />
          </div>
          <p className="mt-5 font-serif text-2xl">Loading your book...</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Restoring your last page
          </p>
        </div>
      </main>
    );
  }

  if (error || !book || !document) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-6 text-center">
        <div className="max-w-sm">
          <AlertCircle
            className="mx-auto text-[var(--accent-strong)]"
            size={42}
          />
          <h1 className="mt-5 font-serif text-3xl">Book unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {error || "This book could not be found on this device."}
          </p>
          <Link href="/" className="button-primary mt-6">
            Back to library
          </Link>
        </div>
      </main>
    );
  }

  if (state.bookId !== book.id) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <BookOpen className="animate-pulse text-[var(--accent-strong)]" />
      </main>
    );
  }

  const bookmarked = state.bookmarks.some(
    (bookmark) => bookmark.page === state.currentPage,
  );

  return (
    <main
      {...swipeHandlers}
      className="relative min-h-dvh overflow-x-hidden bg-[var(--bg)] transition-colors duration-200"
      onClick={() =>
        dispatch({
          type: "SET_CONTROLS",
          visible: !state.controlsVisible,
        })
      }
    >
      <div className="mx-auto flex min-h-dvh w-full items-start justify-center">
        <AnimatePresence initial={false} mode="wait" custom={state.direction}>
          <motion.div
            key={state.currentPage}
            custom={state.direction}
            variants={{
              enter: (direction: 1 | -1) => ({
                x: direction > 0 ? "18%" : "-18%",
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (direction: 1 | -1) => ({
                x: direction > 0 ? "-18%" : "18%",
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            <ZoomWrapper pageNumber={state.currentPage}>
              <PDFCanvas
                document={document}
                pageNumber={state.currentPage}
                totalPages={state.totalPages}
              />
            </ZoomWrapper>
          </motion.div>
        </AnimatePresence>
      </div>

      <ReaderControls
        visible={state.controlsVisible}
        title={state.title}
        page={state.currentPage}
        totalPages={state.totalPages}
        bookmarked={bookmarked}
        onBookmark={toggleCurrentBookmark}
        onMenu={() => {
          setSettingsOpen(true);
          wakeControls();
        }}
        onPrevious={previous}
        onNext={next}
        onJumpRequest={() => setJumpOpen(true)}
        onPageChange={goToPage}
        onActivity={wakeControls}
      />

      <ReaderSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        bookmarkCount={state.bookmarks.length}
        hasContents={outline.length > 0}
        pagesRead={progress.pagesRead.length}
        sessions={progress.sessions}
        onOpenBookmarks={() => {
          setSettingsOpen(false);
          setBookmarksOpen(true);
        }}
        onOpenContents={() => {
          setSettingsOpen(false);
          setTocOpen(true);
        }}
      />
      <BookmarkPanel
        open={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        bookmarks={state.bookmarks}
        onSelect={goToPage}
      />
      <TOCPanel
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        items={outline}
        onSelect={goToPage}
      />
      <PageJumpModal
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        onJump={goToPage}
      />
    </main>
  );
}
