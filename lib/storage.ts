"use client";

import { openDB, type DBSchema } from "idb";
import type { BookRecord, BookSummary } from "@/types/book";

interface BookshelfDB extends DBSchema {
  books: {
    key: string;
    value: BookRecord;
    indexes: { "by-added": string };
  };
}

const DB_NAME = "folio-bookshelf";
const DB_VERSION = 1;

function getDatabase() {
  return openDB<BookshelfDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("books", { keyPath: "id" });
      store.createIndex("by-added", "addedAt");
    },
  });
}

export async function saveBook(book: BookRecord): Promise<void> {
  const db = await getDatabase();
  await db.put("books", book);
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  const db = await getDatabase();
  return db.get("books", id);
}

export async function getBookSummaries(): Promise<BookSummary[]> {
  const db = await getDatabase();
  const books = await db.getAllFromIndex("books", "by-added");

  return books
    .map(({ pdfData: _pdfData, ...summary }) => summary)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete("books", id);
}
