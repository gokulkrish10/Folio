"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileImage, Highlighter, LoaderCircle } from "lucide-react";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PDFCanvas } from "@/components/reader/PDFCanvas";
import { extractReflowBlocks } from "@/lib/pdf-engine";
import { getLanguagePresentation } from "@/lib/text-language";
import type {
  HighlightColor,
  ReaderTextSettings,
  ReflowBlock,
  StudyHighlight,
} from "@/types/book";

interface ReflowTextPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  settings: ReaderTextSettings;
  onUseOriginal: () => void;
  highlights?: StudyHighlight[];
  onHighlight?: (
    blockIndex: number,
    quote: string,
    color: HighlightColor,
  ) => void;
}

const highlightClasses: Record<HighlightColor, string> = {
  amber: "bg-amber-300/65",
  mint: "bg-emerald-300/55",
  blue: "bg-sky-300/55",
  rose: "bg-rose-300/55",
};

function renderHighlightedText(
  text: string,
  highlights: StudyHighlight[],
): ReactNode {
  const ranges = highlights
    .map((highlight) => {
      const start = text.indexOf(highlight.quote);
      return {
        highlight,
        start,
        end: start + highlight.quote.length,
      };
    })
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start)
    .filter(
      (range, index, all) =>
        index === 0 || range.start >= all[index - 1].end,
    );

  if (!ranges.length) return text;

  const content: ReactNode[] = [];
  let offset = 0;
  for (const range of ranges) {
    if (range.start > offset) {
      content.push(
        <Fragment key={`text-${offset}`}>
          {text.slice(offset, range.start)}
        </Fragment>,
      );
    }
    content.push(
      <mark
        key={range.highlight.id}
        className={`study-highlight ${highlightClasses[range.highlight.color]}`}
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    offset = range.end;
  }
  if (offset < text.length) {
    content.push(<Fragment key={`text-${offset}`}>{text.slice(offset)}</Fragment>);
  }
  return content;
}

export function ReflowTextPage({
  document,
  pageNumber,
  totalPages,
  settings,
  onUseOriginal,
  highlights = [],
  onHighlight,
}: ReflowTextPageProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [blocks, setBlocks] = useState<ReflowBlock[] | null>(null);
  const [error, setError] = useState(false);
  const [selection, setSelection] = useState<{
    quote: string;
    blockIndex: number;
    left: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    let active = true;

    extractReflowBlocks(document, pageNumber)
      .then((nextBlocks) => {
        if (!active) return;
        setBlocks(nextBlocks);

        window.setTimeout(() => {
          const adjacentPages = [pageNumber + 1, pageNumber - 1].filter(
            (page) => page >= 1 && page <= totalPages,
          );
          for (const adjacentPage of adjacentPages) {
            void extractReflowBlocks(document, adjacentPage);
          }
        }, 80);
      })
      .catch(() => {
        if (active) {
          setBlocks([]);
          setError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [document, pageNumber, totalPages]);

  const captureSelection = () => {
    if (!onHighlight) return;
    window.setTimeout(() => {
      const selected = window.getSelection();
      if (!selected || selected.isCollapsed || !articleRef.current) {
        setSelection(null);
        return;
      }

      const anchor =
        selected.anchorNode instanceof Element
          ? selected.anchorNode
          : selected.anchorNode?.parentElement;
      const focus =
        selected.focusNode instanceof Element
          ? selected.focusNode
          : selected.focusNode?.parentElement;
      const anchorBlock = anchor?.closest<HTMLElement>("[data-block-index]");
      const focusBlock = focus?.closest<HTMLElement>("[data-block-index]");
      if (
        !anchorBlock ||
        anchorBlock !== focusBlock ||
        !articleRef.current.contains(anchorBlock)
      ) {
        setSelection(null);
        return;
      }

      const quote = selected.toString().replace(/\s+/g, " ").trim();
      if (quote.length < 2 || quote.length > 600) {
        setSelection(null);
        return;
      }

      const rect = selected.getRangeAt(0).getBoundingClientRect();
      setSelection({
        quote,
        blockIndex: Number(anchorBlock.dataset.blockIndex),
        left: Math.min(
          window.innerWidth - 148,
          Math.max(12, rect.left + rect.width / 2 - 70),
        ),
        top: Math.max(76, rect.top - 54),
      });
    }, 0);
  };

  if (blocks === null) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="text-center text-[var(--muted)]">
          <LoaderCircle className="mx-auto animate-spin" size={26} />
          <p className="mt-3 text-sm">Preparing readable text...</p>
        </div>
      </div>
    );
  }

  if (blocks.length === 0) {
    if (!error) {
      return (
        <div className="w-full pb-32 pt-16 sm:pt-20">
          <div className="mx-auto mb-3 w-fit rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] shadow-card">
            Scanned page shown in its original layout
          </div>
          <PDFCanvas
            document={document}
            pageNumber={pageNumber}
            totalPages={totalPages}
          />
        </div>
      );
    }

    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-card">
          <FileImage
            className="mx-auto text-[var(--accent-strong)]"
            size={34}
          />
          <h2 className="mt-4 font-serif text-2xl">Text is not available</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This page could not be converted into readable text.
          </p>
          <button
            type="button"
            onClick={onUseOriginal}
            className="button-primary mt-5 w-full"
          >
            Show original page
          </button>
        </div>
      </div>
    );
  }

  const pageText = blocks.map((block) => block.text).join(" ");
  const pagePresentation = getLanguagePresentation(
    pageText,
    settings.language,
  );

  return (
    <article
      ref={articleRef}
      className="reflow-page mx-auto min-h-dvh w-full max-w-[46rem] px-5 pb-40 pt-20 sm:px-10 sm:pt-24"
      lang={pagePresentation.lang}
      dir={pagePresentation.direction}
      data-script={pagePresentation.script}
      style={
        {
          "--reader-font-size": `${settings.fontSize}px`,
          "--reader-line-height": settings.lineHeight,
        } as React.CSSProperties
      }
      aria-label={`Readable text for page ${pageNumber} of ${totalPages}`}
      onMouseUp={captureSelection}
      onTouchEnd={captureSelection}
    >
      {blocks.map((block, index) => {
        const presentation = getLanguagePresentation(
          block.text,
          settings.language,
        );
        const languageProps = {
          lang: presentation.lang,
          dir: presentation.direction,
          "data-script": presentation.script,
          "data-block-index": index,
        };
        const blockHighlights = highlights.filter(
          (highlight) => highlight.blockIndex === index,
        );

        if (block.type === "heading") {
          const Heading =
            block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          return (
            <Heading
              key={`${block.type}-${index}`}
              className={`reflow-heading reflow-heading-${block.level || 3}`}
              {...languageProps}
            >
              {renderHighlightedText(block.text, blockHighlights)}
            </Heading>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="reflow-paragraph"
            {...languageProps}
          >
            {renderHighlightedText(block.text, blockHighlights)}
          </p>
        );
      })}
      <p className="mt-14 text-center text-xs tracking-[0.14em] text-[var(--muted)]">
        PAGE {pageNumber} OF {totalPages}
      </p>
      {selection ? (
        <div
          className="fixed z-[68] flex items-center gap-1 rounded-2xl bg-[#171717] p-2 text-white shadow-2xl"
          style={{ left: selection.left, top: selection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => event.stopPropagation()}
          role="toolbar"
          aria-label="Highlight selected text"
        >
          <Highlighter size={16} className="mx-1 text-white/70" />
          {(Object.keys(highlightClasses) as HighlightColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onHighlight?.(selection.blockIndex, selection.quote, color);
                window.getSelection()?.removeAllRanges();
                setSelection(null);
              }}
              className={`size-8 rounded-xl border border-white/20 ${highlightClasses[color]}`}
              aria-label={`Highlight in ${color}`}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
