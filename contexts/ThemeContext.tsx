"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getStoredTheme, saveStoredTheme } from "@/lib/reading-progress";
import type { ReaderTheme } from "@/types/book";

interface ThemeContextValue {
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("folio-theme-change", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("folio-theme-change", onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    getStoredTheme,
    (): ReaderTheme => "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((nextTheme: ReaderTheme) => {
    saveStoredTheme(nextTheme);
    window.dispatchEvent(new Event("folio-theme-change"));
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
