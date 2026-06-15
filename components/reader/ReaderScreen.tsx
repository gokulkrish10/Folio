"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkPanel } from "@/components/reader/BookmarkPanel";
import { PageJumpModal } from "@/components/reader/PageJumpModal";
import { PDFCanvas } from "@/components/reader/PDFCanvas";
import { ReflowTextPage } from "@/components/reader/ReflowTextPage";
import { ReaderControls } from "@/components/reader/ReaderControls";
import { ReaderSettings } from "@/components/reader/ReaderSettings";
import { StudyWorkspace } from "@/components/reader/StudyWorkspace";
import { TOCPanel } from "@/components/reader/TOCPanel";
import { ZoomWrapper } from "@/components/reader/ZoomWrapper";
import { useReader } from "@/contexts/ReaderContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { usePDFRenderer } from "@/hooks/usePDFRenderer";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import {
  getReadingProgress,
  getStoredReaderLayout,
  getStoredTextSettings,
  getStoredZoom,
  saveStoredReaderLayout,
  saveStoredTextSettings,
  saveStoredZoom,
} from "@/lib/reading-progress";
import {
  addStudyHighlight,
  getStudyData,
  removeStudyHighlight,
  saveStudyNote,
} from "@/lib/study-storage";
import type {
  HighlightColor,
  ReaderLayout,
  ReaderTextSettings,
  StudyData,
} from "@/types/book";

interface ReaderScreenProps {
  bookId: string;
}

export function ReaderScreen({ bookId }: ReaderScreenProps) {
  const { state, dispatch } = useReader();
  const { theme, setTheme } = useTheme();
  const { book, document, outline, loading, error } = usePDFRenderer(bookId);
  const { progress, startSession, savePage, toggleBookmark } =
    useReadingProgress(bookId);
  const initializedRef = useRef(false);
  const [activity, setActivity] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyEnabled, setStudyEnabled] = useState(false);
  const [studyData, setStudyData] = useState<StudyData>(() =>
    getStudyData(bookId),
  );
  const [zoomScale, setZoomScale] = useState(() => getStoredZoom(bookId));
  const [readerLayout, setReaderLayout] = useState<ReaderLayout>(() =>
    getStoredReaderLayout(bookId),
  );
  const [textSettings, setTextSettings] = useState<ReaderTextSettings>(
    getStoredTextSettings,
  );
  const zoomed = readerLayout === "page" && zoomScale > 1.01;

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
    if (book.purpose === "study") {
      window.setTimeout(() => {
        setStudyEnabled(true);
        setStudyOpen(true);
      }, 0);
    }
    startSession();
  }, [book, dispatch, startSession]);

  useEffect(() => {
    if (!book || state.bookId !== book.id) return;
    savePage(state.currentPage);
  }, [book, savePage, state.bookId, state.currentPage]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => saveStoredZoom(bookId, zoomScale),
      200,
    );
    return () => window.clearTimeout(timer);
  }, [bookId, zoomScale]);

  useEffect(() => {
    saveStoredReaderLayout(bookId, readerLayout);
  }, [bookId, readerLayout]);

  useEffect(() => {
    saveStoredTextSettings(textSettings);
  }, [textSettings]);

  useEffect(() => {
    if (readerLayout === "reflow") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [readerLayout, state.currentPage]);

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
  const swipeHandlers = useSwipeNavigation(previous, next, !zoomed);

  const anyPanelOpen =
    settingsOpen || bookmarksOpen || tocOpen || jumpOpen || studyOpen;

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

  const useOriginalPage = useCallback(() => {
    setReaderLayout("page");
    setZoomScale(1);
    wakeControls();
  }, [wakeControls]);

  const toggleCurrentBookmark = () => {
    const updated = toggleBookmark(state.currentPage);
    dispatch({ type: "SET_BOOKMARKS", bookmarks: updated.bookmarks });
    wakeControls();
  };

  const createHighlight = (
    blockIndex: number,
    quote: string,
    color: HighlightColor,
  ) => {
    setStudyData(
      addStudyHighlight(
        bookId,
        state.currentPage,
        blockIndex,
        quote,
        color,
      ),
    );
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
      className={`relative bg-[var(--bg)] transition-colors duration-200 ${
        zoomed
          ? "h-dvh overflow-hidden overscroll-none"
          : "min-h-dvh overflow-x-hidden"
      } ${studyOpen ? "lg:pr-[390px]" : ""}`}
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
            key={`${readerLayout}-${state.currentPage}`}
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
            {readerLayout === "reflow" ? (
              <ReflowTextPage
                document={document}
                pageNumber={state.currentPage}
                totalPages={state.totalPages}
                settings={textSettings}
                onUseOriginal={useOriginalPage}
                highlights={studyData.highlights.filter(
                  (highlight) => highlight.page === state.currentPage,
                )}
                onHighlight={studyEnabled ? createHighlight : undefined}
              />
            ) : (
              <ZoomWrapper
                pageNumber={state.currentPage}
                scale={zoomScale}
                onScaleChange={setZoomScale}
              >
                <PDFCanvas
                  document={document}
                  pageNumber={state.currentPage}
                  totalPages={state.totalPages}
                />
              </ZoomWrapper>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ReaderControls
        visible={state.controlsVisible}
        title={state.title}
        page={state.currentPage}
        totalPages={state.totalPages}
        bookmarked={bookmarked}
        nightMode={theme === "dark"}
        studyMode={studyOpen}
        zoomPercent={
          readerLayout === "page" ? Math.round(zoomScale * 100) : 100
        }
        onStudy={() => {
          if (!studyOpen) setStudyEnabled(true);
          setStudyOpen(!studyOpen);
          wakeControls();
        }}
        onToggleNightMode={() => {
          setTheme(theme === "dark" ? "light" : "dark");
          wakeControls();
        }}
        onBookmark={toggleCurrentBookmark}
        onResetZoom={() => {
          setZoomScale(1);
          wakeControls();
        }}
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
        layout={readerLayout}
        textSettings={textSettings}
        onLayoutChange={(layout) => {
          setReaderLayout(layout);
          setSettingsOpen(false);
          wakeControls();
        }}
        onTextSettingsChange={setTextSettings}
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
      <StudyWorkspace
        open={studyOpen}
        title={state.title}
        document={document}
        page={state.currentPage}
        totalPages={state.totalPages}
        layout={readerLayout}
        bookmarks={state.bookmarks}
        studyData={studyData}
        onClose={() => setStudyOpen(false)}
        onNavigate={goToPage}
        onDeleteHighlight={(highlightId) =>
          setStudyData(removeStudyHighlight(bookId, highlightId))
        }
        onSaveNote={(page, text) =>
          setStudyData(saveStudyNote(bookId, page, text))
        }
        onUseReadableText={() => {
          setReaderLayout("reflow");
          if (window.matchMedia("(max-width: 1023px)").matches) {
            setStudyOpen(false);
          }
          wakeControls();
        }}
      />
    </main>
  );
}
