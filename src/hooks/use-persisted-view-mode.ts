"use client";

import { useCallback, useEffect, useState } from "react";

import type { ViewMode } from "@/components/view-toggle";

const STORAGE_KEY = "smart-advisor:view-mode";

// Persists the grid/list view choice across pages (library + history) via
// localStorage so the user's preference carries over instead of resetting to
// each page's hardcoded default.
export function usePersistedViewMode(
  fallback: ViewMode = "grid",
): [ViewMode, (next: ViewMode) => void] {
  const [view, setViewState] = useState<ViewMode>(fallback);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setViewState(stored);
    }
  }, []);

  const setView = useCallback((next: ViewMode) => {
    setViewState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, quota) — ignore.
    }
  }, []);

  return [view, setView];
}
