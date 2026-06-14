"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { renderPDFPage } from "@/lib/pdf-engine";

interface CachedPage {
  canvas: HTMLCanvasElement;
  width: number;
}

const documentCaches = new WeakMap<
  PDFDocumentProxy,
  Map<number, CachedPage>
>();

function getCache(document: PDFDocumentProxy) {
  let cache = documentCaches.get(document);
  if (!cache) {
    cache = new Map();
    documentCaches.set(document, cache);
  }
  return cache;
}

async function renderToCache(
  document: PDFDocumentProxy,
  pageNumber: number,
  width: number,
) {
  const cache = getCache(document);
  const existing = cache.get(pageNumber);
  if (existing && Math.abs(existing.width - width) < 2) return existing;

  const page = await document.getPage(pageNumber);
  const canvas = window.document.createElement("canvas");
  await renderPDFPage(page, canvas, width);
  const cached = { canvas, width };
  cache.set(pageNumber, cached);

  if (cache.size > 5) {
    const oldestKey = cache.keys().next().value as number | undefined;
    if (oldestKey !== undefined && oldestKey !== pageNumber) {
      cache.delete(oldestKey);
    }
  }
  return cached;
}

interface PDFCanvasProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  onRendered?: () => void;
}

export function PDFCanvas({
  document,
  pageNumber,
  totalPages,
  onRendered,
}: PDFCanvasProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const updateWidth = () => setWidth(Math.min(shell.clientWidth, 900));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!width || !canvasRef.current) return;
    let active = true;
    setLoading(true);
    setError(false);

    const render = async () => {
      try {
        const cached = await renderToCache(document, pageNumber, width);
        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas is unavailable.");

        canvas.width = cached.canvas.width;
        canvas.height = cached.canvas.height;
        canvas.style.width = cached.canvas.style.width;
        canvas.style.height = cached.canvas.style.height;
        context.drawImage(cached.canvas, 0, 0);
        setLoading(false);
        onRendered?.();

        window.setTimeout(() => {
          const adjacent = [pageNumber + 1, pageNumber - 1].filter(
            (page) => page >= 1 && page <= totalPages,
          );
          for (const page of adjacent) {
            void renderToCache(document, page, width);
          }
        }, 50);
      } catch {
        if (active) {
          setLoading(false);
          setError(true);
        }
      }
    };

    void render();
    return () => {
      active = false;
    };
  }, [document, onRendered, pageNumber, totalPages, width]);

  return (
    <div
      ref={shellRef}
      className="reader-canvas-shell relative mx-auto min-h-[65dvh] w-full max-w-[900px]"
      aria-busy={loading}
    >
      {loading ? (
        <div className="absolute inset-x-0 top-0 mx-auto aspect-[0.72] w-full max-w-[900px] animate-pulse bg-[var(--surface-muted)]" />
      ) : null}
      {error ? (
        <div className="grid min-h-[65dvh] place-items-center px-6 text-center text-sm text-[var(--muted)]">
          This page could not be rendered. Try moving to another page.
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={`mx-auto max-w-full transition-opacity duration-200 ${
          loading || error ? "opacity-0" : "opacity-100"
        }`}
        aria-label={`PDF page ${pageNumber} of ${totalPages}`}
      />
    </div>
  );
}
