"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { Bookmark } from "@/types/book";

interface ReaderState {
  bookId: string;
  title: string;
  totalPages: number;
  currentPage: number;
  bookmarks: Bookmark[];
  direction: 1 | -1;
  controlsVisible: boolean;
}

type ReaderAction =
  | {
      type: "LOAD";
      payload: Omit<ReaderState, "direction" | "controlsVisible">;
    }
  | { type: "GO_TO_PAGE"; page: number }
  | { type: "SET_BOOKMARKS"; bookmarks: Bookmark[] }
  | { type: "SET_CONTROLS"; visible: boolean };

const initialState: ReaderState = {
  bookId: "",
  title: "",
  totalPages: 0,
  currentPage: 1,
  bookmarks: [],
  direction: 1,
  controlsVisible: true,
};

function readerReducer(
  state: ReaderState,
  action: ReaderAction,
): ReaderState {
  switch (action.type) {
    case "LOAD":
      return { ...action.payload, direction: 1, controlsVisible: true };
    case "GO_TO_PAGE": {
      const page = Math.max(1, Math.min(state.totalPages, action.page));
      if (page === state.currentPage) return state;
      return {
        ...state,
        currentPage: page,
        direction: page > state.currentPage ? 1 : -1,
      };
    }
    case "SET_BOOKMARKS":
      return { ...state, bookmarks: action.bookmarks };
    case "SET_CONTROLS":
      return { ...state, controlsVisible: action.visible };
    default:
      return state;
  }
}

const ReaderContext = createContext<{
  state: ReaderState;
  dispatch: Dispatch<ReaderAction>;
} | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(readerReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) throw new Error("useReader must be used inside ReaderProvider.");
  return context;
}
