# Folio

Folio is a private, offline-first PDF book reader built with Next.js, PDF.js,
IndexedDB, Framer Motion, and Tailwind CSS. Books never leave the browser.

## Features

- Drag-and-drop PDF upload or public PDF link import
- Metadata and cover extraction for both local and linked books
- One-page reading with swipe, keyboard, scrubber, and page-jump navigation
- Mobile-first readable-text mode that reflows PDF text to the screen width
- Automatic reading position, bookmark, session, and unique-page tracking
- Light, sepia, and true low-light night reading themes
- Persistent pinch and double-tap zoom with bounded page panning
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

Linked PDFs pass temporarily through the app's `/api/pdf` route to avoid
cross-origin browser restrictions. The route accepts only public HTTP(S)
addresses, blocks private-network destinations, validates the PDF signature,
and limits imports to 75 MB. The server does not retain the file.

Browser storage quotas vary by platform. Very large libraries can be removed
by the operating system when device storage is constrained, so original PDFs
should be kept elsewhere as a backup.

## Mobile gestures

- Swipe left or right to change pages.
- Tap the reading surface to show or hide controls.
- Pinch to zoom, or double-tap to toggle 150% zoom.
- While zoomed, drag freely to read the left, right, top, or bottom of the
  page. Page-swipe navigation is paused so panning cannot change pages.
- Zoom level stays active across page changes and browser reloads. Tap the
  percentage in the bottom controls to reset to 100%.
- Use the page count in the bottom bar to jump directly to a page.
- Tap the moon in the reader top bar for instant night mode.
- Use Reading settings to switch between responsive readable text and the
  original PDF page. Text size is adjustable and saved across sessions.
