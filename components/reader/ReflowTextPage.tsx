"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileImage, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { extractReflowBlocks } from "@/lib/pdf-engine";
import type { ReaderTextSettings, ReflowBlock } from "@/types/book";

interface ReflowTextPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  settings: ReaderTextSettings;
  onUseOriginal: () => void;
}

export function ReflowTextPage({
  document,
  pageNumber,
  totalPages,
  settings,
  onUseOriginal,
}: ReflowTextPageProps) {
  const [blocks, setBlocks] = useState<ReflowBlock[] | null>(null);
  const [error, setError] = useState(false);

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
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-card">
          <FileImage
            className="mx-auto text-[var(--accent-strong)]"
            size={34}
          />
          <h2 className="mt-4 font-serif text-2xl">Text is not available</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {error
              ? "This page could not be converted into readable text."
              : "This looks like a scanned or image-based PDF page."}
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

  return (
    <article
      className="reflow-page mx-auto min-h-dvh w-full max-w-[46rem] px-5 pb-40 pt-20 sm:px-10 sm:pt-24"
      style={
        {
          "--reader-font-size": `${settings.fontSize}px`,
          "--reader-line-height": settings.lineHeight,
        } as React.CSSProperties
      }
      aria-label={`Readable text for page ${pageNumber} of ${totalPages}`}
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading =
            block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          return (
            <Heading
              key={`${block.type}-${index}`}
              className={`reflow-heading reflow-heading-${block.level || 3}`}
            >
              {block.text}
            </Heading>
          );
        }

        return (
          <p key={`${block.type}-${index}`} className="reflow-paragraph">
            {block.text}
          </p>
        );
      })}
      <p className="mt-14 text-center text-xs tracking-[0.14em] text-[var(--muted)]">
        PAGE {pageNumber} OF {totalPages}
      </p>
    </article>
  );
}
