"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { extractOutline, loadPDF } from "@/lib/pdf-engine";
import { getBook } from "@/lib/storage";
import type { BookRecord, TocItem } from "@/types/book";

interface PDFRendererState {
  book: BookRecord | null;
  document: PDFDocumentProxy | null;
  outline: TocItem[];
  loading: boolean;
  error: string | null;
}

export function usePDFRenderer(bookId: string): PDFRendererState {
  const [state, setState] = useState<PDFRendererState>({
    book: null,
    document: null,
    outline: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    let loadedDocument: PDFDocumentProxy | null = null;

    const load = async () => {
      try {
        const book = await getBook(bookId);
        if (!book) throw new Error("This book is not in your library.");
        loadedDocument = await loadPDF(book.pdfData);
        const outline = await extractOutline(loadedDocument).catch(() => []);
        if (active) {
          setState({
            book,
            document: loadedDocument,
            outline,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "The PDF could not be opened.",
          }));
        }
      }
    };

    void load();
    return () => {
      active = false;
      void loadedDocument?.cleanup();
    };
  }, [bookId]);

  return state;
}
