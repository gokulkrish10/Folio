"use client";

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import type { ReflowBlock, TocItem } from "@/types/book";

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

interface TextLine {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
}

interface ExtractedTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
  dir: string;
}

const textPageCache = new WeakMap<
  PDFDocumentProxy,
  Map<number, ReflowBlock[]>
>();

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function joinTextItems(items: ExtractedTextItem[]) {
  let text = "";
  let previous: ExtractedTextItem | null = null;

  for (const item of items) {
    const value = item.str.replace(/\s+/g, " ").trim();
    if (!value) continue;

    if (previous && text) {
      const previousEnd = previous.transform[4] + previous.width;
      const gap = item.transform[4] - previousEnd;
      const fontSize = Math.max(
        1,
        Math.hypot(item.transform[0], item.transform[1]),
      );
      const needsSpace =
        gap > fontSize * 0.08 &&
        !/[\s([{/-]$/.test(text) &&
        !/^[,.;:!?%)\]}]/.test(value);
      if (needsSpace) text += " ";
    }

    text += value;
    previous = item;
  }

  return text.trim();
}

function mergeParagraphLine(current: string, next: string) {
  if (!current) return next;
  if (/-$/.test(current) && /^[a-z]/.test(next)) {
    return `${current.slice(0, -1)}${next}`;
  }
  return `${current} ${next}`;
}

export async function extractReflowBlocks(
  document: PDFDocumentProxy,
  pageNumber: number,
): Promise<ReflowBlock[]> {
  let cache = textPageCache.get(document);
  if (!cache) {
    cache = new Map();
    textPageCache.set(document, cache);
  }
  const cached = cache.get(pageNumber);
  if (cached) return cached;

  const page = await document.getPage(pageNumber);
  const pageWidth = page.getViewport({ scale: 1 }).width;
  const content = await page.getTextContent();
  const items = content.items.filter(
    (item): item is ExtractedTextItem =>
      "str" in item && Boolean(item.str.trim()),
  );

  if (!items.length) {
    cache.set(pageNumber, []);
    return [];
  }

  const itemSizes = items
    .map((item) => Math.hypot(item.transform[0], item.transform[1]))
    .filter((size) => size > 0);
  const baseFontSize = median(itemSizes) || 12;
  const yTolerance = Math.max(2, baseFontSize * 0.38);
  const sortedItems = [...items].sort((a, b) => {
    const yDifference = b.transform[5] - a.transform[5];
    return Math.abs(yDifference) > yTolerance
      ? yDifference
      : a.transform[4] - b.transform[4];
  });

  const yBands: ExtractedTextItem[][] = [];
  for (const item of sortedItems) {
    const y = item.transform[5];
    const existing = yBands.find(
      (line) => Math.abs(line[0].transform[5] - y) <= yTolerance,
    );
    if (existing) {
      existing.push(item);
    } else {
      yBands.push([item]);
    }
  }

  const lineGroups = yBands.flatMap((band) => {
    const ordered = [...band].sort(
      (a, b) => a.transform[4] - b.transform[4],
    );
    const groups: ExtractedTextItem[][] = [];

    for (const item of ordered) {
      const current = groups.at(-1);
      const previous = current?.at(-1);
      const gap = previous
        ? item.transform[4] - (previous.transform[4] + previous.width)
        : 0;
      const columnGap = Math.max(baseFontSize * 4, pageWidth * 0.055);

      if (!current || (previous && gap > columnGap)) {
        groups.push([item]);
      } else {
        current.push(item);
      }
    }

    return groups;
  });

  let lines: TextLine[] = lineGroups
    .map((lineItems) => {
      const ordered = [...lineItems].sort(
        (a, b) => a.transform[4] - b.transform[4],
      );
      const x = Math.min(...ordered.map((item) => item.transform[4]));
      const right = Math.max(
        ...ordered.map((item) => item.transform[4] + item.width),
      );
      return {
        text: joinTextItems(ordered),
        x,
        y: median(ordered.map((item) => item.transform[5])),
        width: right - x,
        fontSize: median(
          ordered.map((item) =>
            Math.hypot(item.transform[0], item.transform[1]),
          ),
        ),
      };
    })
    .filter((line) => line.text)
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const leftColumnLines = lines.filter(
    (line) =>
      line.x < pageWidth * 0.42 &&
      line.x + line.width < pageWidth * 0.64,
  );
  const rightColumnLines = lines.filter((line) => line.x >= pageWidth * 0.42);
  const hasColumns =
    leftColumnLines.length >= 6 &&
    rightColumnLines.length >= 6 &&
    rightColumnLines.length >= lines.length * 0.2;

  if (hasColumns) {
    const columnStartY = Math.max(...rightColumnLines.map((line) => line.y));
    const prelude = lines.filter(
      (line) => line.y > columnStartY + baseFontSize * 0.75,
    );
    const columnBody = lines.filter(
      (line) => line.y <= columnStartY + baseFontSize * 0.75,
    );
    const left = columnBody.filter((line) => line.x < pageWidth * 0.5);
    const right = columnBody.filter((line) => line.x >= pageWidth * 0.5);
    lines = [
      ...prelude.sort((a, b) => b.y - a.y || a.x - b.x),
      ...left.sort((a, b) => b.y - a.y || a.x - b.x),
      ...right.sort((a, b) => b.y - a.y || a.x - b.x),
    ];
  }

  const lineGaps = lines
    .slice(1)
    .map((line, index) => lines[index].y - line.y)
    .filter((gap) => gap > 0 && gap < baseFontSize * 3);
  const normalLineGap = median(lineGaps) || baseFontSize * 1.25;
  const blocks: ReflowBlock[] = [];
  let paragraph = "";
  let previousLine: TextLine | null = null;

  const flushParagraph = () => {
    const text = paragraph.replace(/\s+/g, " ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = "";
  };

  for (const line of lines) {
    const heading =
      line.text.length <= 140 &&
      line.fontSize >= baseFontSize * 1.22;
    const gap = previousLine ? previousLine.y - line.y : 0;
    const indented =
      previousLine &&
      line.x - previousLine.x > Math.max(baseFontSize * 1.2, 12);
    const paragraphBreak =
      Boolean(previousLine) &&
      (gap <= 0 ||
        gap > normalLineGap * 1.55 ||
        (Boolean(indented) &&
          /[.!?…"”'’)]$/.test(previousLine?.text || "")));

    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        text: line.text,
        level:
          line.fontSize >= baseFontSize * 1.8
            ? 1
            : line.fontSize >= baseFontSize * 1.45
              ? 2
              : 3,
      });
    } else {
      if (paragraphBreak) flushParagraph();
      paragraph = mergeParagraphLine(paragraph, line.text);
    }

    previousLine = line;
  }

  flushParagraph();
  cache.set(pageNumber, blocks);
  return blocks;
}
