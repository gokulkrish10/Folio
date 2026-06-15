"use client";

import {
  AlignLeft,
  Bookmark,
  Check,
  ChevronRight,
  FileText,
  ListTree,
  Minus,
  Plus,
  Timer,
} from "lucide-react";
import { ThemeSelector } from "@/components/reader/ThemeSelector";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type {
  ReaderLanguage,
  ReaderLayout,
  ReaderTextSettings,
} from "@/types/book";

const languages: Array<{ value: ReaderLanguage; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi - हिन्दी" },
  { value: "ml", label: "Malayalam - മലയാളം" },
  { value: "ta", label: "Tamil - தமிழ்" },
  { value: "te", label: "Telugu - తెలుగు" },
  { value: "kn", label: "Kannada - ಕನ್ನಡ" },
  { value: "bn", label: "Bengali - বাংলা" },
  { value: "gu", label: "Gujarati - ગુજરાતી" },
  { value: "pa", label: "Punjabi - ਪੰਜਾਬੀ" },
  { value: "ur", label: "Urdu - اردو" },
  { value: "ar", label: "Arabic - العربية" },
  { value: "zh", label: "Chinese - 中文" },
  { value: "ja", label: "Japanese - 日本語" },
  { value: "ko", label: "Korean - 한국어" },
  { value: "es", label: "Spanish - Español" },
  { value: "fr", label: "French - Français" },
  { value: "de", label: "German - Deutsch" },
  { value: "pt", label: "Portuguese - Português" },
  { value: "ru", label: "Russian - Русский" },
];

interface ReaderSettingsProps {
  open: boolean;
  onClose: () => void;
  bookmarkCount: number;
  hasContents: boolean;
  pagesRead: number;
  sessions: number;
  layout: ReaderLayout;
  textSettings: ReaderTextSettings;
  onLayoutChange: (layout: ReaderLayout) => void;
  onTextSettingsChange: (settings: ReaderTextSettings) => void;
  onOpenBookmarks: () => void;
  onOpenContents: () => void;
}

export function ReaderSettings({
  open,
  onClose,
  bookmarkCount,
  hasContents,
  pagesRead,
  sessions,
  layout,
  textSettings,
  onLayoutChange,
  onTextSettingsChange,
  onOpenBookmarks,
  onOpenContents,
}: ReaderSettingsProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Reading settings">
      <p className="eyebrow mb-3">Appearance</p>
      <ThemeSelector />

      <p className="eyebrow mb-3 mt-7">Reading layout</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onLayoutChange("reflow")}
          className={`relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border transition ${
            layout === "reflow"
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-muted)]"
          }`}
          aria-pressed={layout === "reflow"}
        >
          <AlignLeft size={21} />
          <span className="text-sm font-semibold">Readable text</span>
          <span className="text-[10px] text-[var(--muted)]">
            Adapts to screen
          </span>
          {layout === "reflow" ? (
            <Check
              className="absolute right-2 top-2 text-[var(--accent-strong)]"
              size={15}
            />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange("page")}
          className={`relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border transition ${
            layout === "page"
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-muted)]"
          }`}
          aria-pressed={layout === "page"}
        >
          <FileText size={21} />
          <span className="text-sm font-semibold">Original page</span>
          <span className="text-[10px] text-[var(--muted)]">
            Keeps PDF layout
          </span>
          {layout === "page" ? (
            <Check
              className="absolute right-2 top-2 text-[var(--accent-strong)]"
              size={15}
            />
          ) : null}
        </button>
      </div>

      {layout === "reflow" ? (
        <div className="mt-4 space-y-4 rounded-2xl bg-[var(--surface-muted)] p-4">
          <label className="block">
            <span className="text-sm font-semibold">Book language</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Auto-detect chooses suitable type and text direction.
            </span>
            <select
              value={textSettings.language}
              onChange={(event) =>
                onTextSettingsChange({
                  ...textSettings,
                  language: event.target.value as ReaderLanguage,
                })
              }
              className="mt-3 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              aria-label="Book language"
            >
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <div className="h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Text size</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {textSettings.fontSize}px · comfortable spacing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onTextSettingsChange({
                    ...textSettings,
                    fontSize: Math.max(15, textSettings.fontSize - 1),
                  })
                }
                disabled={textSettings.fontSize <= 15}
                className="icon-button border border-[var(--border)] disabled:opacity-35"
                aria-label="Decrease text size"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onTextSettingsChange({
                    ...textSettings,
                    fontSize: Math.min(28, textSettings.fontSize + 1),
                  })
                }
                disabled={textSettings.fontSize >= 28}
                className="icon-button border border-[var(--border)] disabled:opacity-35"
                aria-label="Increase text size"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="eyebrow mb-3 mt-7">Navigate</p>
      <div className="overflow-hidden rounded-2xl bg-[var(--surface-muted)]">
        <button
          type="button"
          onClick={onOpenBookmarks}
          className="flex min-h-16 w-full items-center gap-3 border-b border-[var(--border)] px-4 text-left transition hover:opacity-75"
        >
          <Bookmark size={19} className="text-[var(--accent-strong)]" />
          <span className="flex-1 font-medium">Bookmarks</span>
          <span className="text-xs text-[var(--muted)]">{bookmarkCount}</span>
          <ChevronRight size={17} className="text-[var(--muted)]" />
        </button>
        <button
          type="button"
          onClick={onOpenContents}
          disabled={!hasContents}
          className="flex min-h-16 w-full items-center gap-3 px-4 text-left transition hover:opacity-75 disabled:opacity-40"
        >
          <ListTree size={19} className="text-[var(--accent-strong)]" />
          <span className="flex-1 font-medium">Contents</span>
          {!hasContents ? (
            <span className="text-xs text-[var(--muted)]">Unavailable</span>
          ) : null}
          <ChevronRight size={17} className="text-[var(--muted)]" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 text-sm">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Timer size={19} />
        </span>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--text)]">{pagesRead}</strong> unique
          pages read across{" "}
          <strong className="text-[var(--text)]">{sessions}</strong>{" "}
          {sessions === 1 ? "session" : "sessions"}.
        </p>
      </div>
    </BottomSheet>
  );
}
