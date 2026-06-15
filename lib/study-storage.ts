"use client";

import type {
  HighlightColor,
  StudyData,
  StudyHighlight,
  StudyNote,
} from "@/types/book";

const STUDY_PREFIX = "folio:study:";

function emptyStudyData(): StudyData {
  return { highlights: [], notes: [] };
}

function storageAvailable() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getStudyData(bookId: string): StudyData {
  if (!storageAvailable()) return emptyStudyData();

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(`${STUDY_PREFIX}${bookId}`) || "{}",
    ) as Partial<StudyData>;
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return emptyStudyData();
  }
}

function saveStudyData(bookId: string, data: StudyData) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(`${STUDY_PREFIX}${bookId}`, JSON.stringify(data));
}

export function addStudyHighlight(
  bookId: string,
  page: number,
  blockIndex: number,
  quote: string,
  color: HighlightColor,
): StudyData {
  const data = getStudyData(bookId);
  const duplicate = data.highlights.some(
    (highlight) =>
      highlight.page === page &&
      highlight.blockIndex === blockIndex &&
      highlight.quote === quote,
  );
  if (duplicate) return data;

  const highlight: StudyHighlight = {
    id: createId(),
    page,
    blockIndex,
    quote,
    color,
    createdAt: new Date().toISOString(),
  };
  const updated = {
    ...data,
    highlights: [highlight, ...data.highlights],
  };
  saveStudyData(bookId, updated);
  return updated;
}

export function removeStudyHighlight(
  bookId: string,
  highlightId: string,
): StudyData {
  const data = getStudyData(bookId);
  const updated = {
    ...data,
    highlights: data.highlights.filter(
      (highlight) => highlight.id !== highlightId,
    ),
  };
  saveStudyData(bookId, updated);
  return updated;
}

export function saveStudyNote(
  bookId: string,
  page: number,
  text: string,
): StudyData {
  const data = getStudyData(bookId);
  const notes = data.notes.filter((note) => note.page !== page);
  const trimmed = text.trim();
  if (trimmed) {
    const note: StudyNote = {
      page,
      text: trimmed,
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(note);
  }
  const updated = { ...data, notes };
  saveStudyData(bookId, updated);
  return updated;
}

export function removeStudyData(bookId: string) {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(`${STUDY_PREFIX}${bookId}`);
}
