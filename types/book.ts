export type ReaderTheme = "light" | "dark" | "sepia";
export type ReaderLayout = "reflow" | "page";

export interface ReaderTextSettings {
  fontSize: number;
  lineHeight: number;
}

export interface ReflowBlock {
  type: "heading" | "paragraph";
  text: string;
  level?: 1 | 2 | 3;
}

export interface BookRecord {
  id: string;
  title: string;
  totalPages: number;
  pdfData: ArrayBuffer;
  coverDataUrl?: string;
  fileSize: number;
  addedAt: string;
}

export type BookSummary = Omit<BookRecord, "pdfData">;

export interface Bookmark {
  page: number;
  createdAt: string;
}

export interface ReadingProgress {
  currentPage: number;
  bookmarks: Bookmark[];
  dateStarted: string;
  lastReadAt: string;
  pagesRead: number[];
  sessions: number;
}

export interface TocItem {
  title: string;
  pageNumber: number | null;
  items: TocItem[];
}
