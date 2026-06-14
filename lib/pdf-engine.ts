"use client";

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import type { TocItem } from "@/types/book";

let pdfModulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPDFModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfModulePromise;
}

export async function loadPDF(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPDFModule();
  const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
  return task.promise;
}

export async function renderPDFPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  width: number,
): Promise<RenderTask> {
  const baseViewport = page.getViewport({ scale: 1 });
  const cssScale = width / baseViewport.width;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
  const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });
  const cssHeight = baseViewport.height * cssScale;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Canvas is not supported in this browser.");

  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${cssHeight}px`;

  const task = page.render({
    canvas,
    canvasContext: context,
    viewport: renderViewport,
  });
  await task.promise;
  return task;
}

export async function createCoverDataUrl(
  document: PDFDocumentProxy,
): Promise<string | undefined> {
  try {
    const page = await document.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = 360 / viewport.width;
    const renderViewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return undefined;

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    await page.render({
      canvas,
      canvasContext: context,
      viewport: renderViewport,
    }).promise;
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return undefined;
  }
}

export async function extractOutline(
  document: PDFDocumentProxy,
): Promise<TocItem[]> {
  const outline = await document.getOutline();
  if (!outline) return [];

  const mapItems = async (
    items: Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>,
  ): Promise<TocItem[]> => {
    if (!items) return [];

    return Promise.all(
      items.map(async (item) => {
        let pageNumber: number | null = null;
        try {
          const destination =
            typeof item.dest === "string"
              ? await document.getDestination(item.dest)
              : item.dest;
          if (destination?.[0]) {
            const pageRef = destination[0];
            const pageIndex =
              typeof pageRef === "object"
                ? await document.getPageIndex(pageRef)
                : Number(pageRef);
            pageNumber = pageIndex + 1;
          }
        } catch {
          pageNumber = null;
        }

        return {
          title: item.title || "Untitled section",
          pageNumber,
          items: await mapItems(item.items),
        };
      }),
    );
  };

  return mapItems(outline);
}
