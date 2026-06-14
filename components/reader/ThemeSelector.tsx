"use client";

import { Check, Moon, Sun, Sunset } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ReaderTheme } from "@/types/book";

const themes: {
  id: ReaderTheme;
  label: string;
  icon: typeof Sun;
  color: string;
}[] = [
  { id: "light", label: "Light", icon: Sun, color: "#fafaf8" },
  { id: "sepia", label: "Sepia", icon: Sunset, color: "#f4ecd8" },
  { id: "dark", label: "Night", icon: Moon, color: "#0d0d0d" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {themes.map((option) => {
        const Icon = option.icon;
        const active = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={`relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-[var(--surface-muted)]"
            }`}
            aria-pressed={active}
          >
            <span
              className="grid size-9 place-items-center rounded-full border border-black/10"
              style={{
                background: option.color,
                color: option.id === "dark" ? "#e8e8e8" : "#3b2e1a",
              }}
            >
              <Icon size={17} />
            </span>
            <span className="text-xs font-semibold">{option.label}</span>
            {active ? (
              <Check
                className="absolute right-2 top-2 text-[var(--accent-strong)]"
                size={15}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
