# Folio

Folio is a private, offline-first PDF book reader built with Next.js, PDF.js,
IndexedDB, Framer Motion, and Tailwind CSS. Books never leave the browser.

## Features

- Drag-and-drop PDF import with metadata and cover extraction
- One-page reading with swipe, keyboard, scrubber, and page-jump navigation
- Automatic reading position, bookmark, session, and unique-page tracking
- Light, sepia, and night reading themes
- Pinch and double-tap zoom
- PDF outline navigation when a table of contents is present
- IndexedDB book storage and service-worker-powered offline support
- Installable PWA with a mobile-first, safe-area-aware interface

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

The `postinstall` script copies the PDF.js worker to `public/`, keeping worker
and library versions aligned.

## Storage and privacy

PDF bytes and generated cover thumbnails are stored in the browser's
IndexedDB database (`folio-bookshelf`). Reading progress, bookmarks, theme,
and statistics are stored in localStorage. There is no account, upload API, or
external backend.

Browser storage quotas vary by platform. Very large libraries can be removed
by the operating system when device storage is constrained, so original PDFs
should be kept elsewhere as a backup.

## Mobile gestures

- Swipe left or right to change pages.
- Tap the reading surface to show or hide controls.
- Pinch to zoom, or double-tap to toggle 150% zoom.
- Use the page count in the bottom bar to jump directly to a page.
