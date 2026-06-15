export type ReaderTheme = "light" | "dark" | "sepia";
export type ReaderLayout = "reflow" | "page";
export type BookPurpose = "read" | "study";
export type ReaderLanguage =
  | "auto"
  | "en"
  | "hi"
  | "ml"
  | "ta"
  | "te"
  | "kn"
  | "bn"
  | "gu"
  | "pa"
  | "ur"
  | "ar"
  | "zh"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ru";

export interface ReaderTextSettings {
  fontSize: number;
  lineHeight: number;
  language: ReaderLanguage;
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
  purpose?: BookPurpose;
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

export type HighlightColor = "amber" | "mint" | "blue" | "rose";

export interface StudyHighlight {
  id: string;
  page: number;
  blockIndex: number;
  quote: string;
  color: HighlightColor;
  createdAt: string;
}

export interface StudyNote {
  page: number;
  text: string;
  updatedAt: string;
}

export interface StudyData {
  highlights: StudyHighlight[];
  notes: StudyNote[];
}

export interface StudySearchResult {
  page: number;
  snippet: string;
  occurrences: number;
}
