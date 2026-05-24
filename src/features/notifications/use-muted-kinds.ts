"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-device set of muted server-notification kinds. We default to
 * "everything on" — an empty set — so existing installs pick up new
 * kinds without the user having to discover the toggle. Stored as a
 * comma-separated string under `smart_advisor_notif_muted_kinds`, with
 * the same sync pattern as [useFeedVisibility]: `storage` for other
 * tabs + a custom event for same-tab updates.
 *
 * Read by [useNotifications] / [useUnreadNotificationsCount] / the
 * notifications bell so muted kinds are filtered out everywhere with
 * one source of truth.
 */
export const PREF_MUTED_KINDS_KEY = "smart_advisor_notif_muted_kinds";

const MUTED_KINDS_EVENT = "smart-advisor:notif-muted-kinds-change";

export function readMutedKinds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(PREF_MUTED_KINDS_KEY) ?? "";
  if (raw.length === 0) return new Set();
  return new Set(raw.split(","));
}

function writeMutedKinds(next: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PREF_MUTED_KINDS_KEY,
    Array.from(next).join(","),
  );
  window.dispatchEvent(new Event(MUTED_KINDS_EVENT));
}

export function useMutedKinds(): {
  muted: Set<string>;
  isMuted: (kind: string) => boolean;
  setMuted: (kind: string, muted: boolean) => void;
} {
  // Start empty so SSR and first client render agree; the real value
  // is hydrated in the effect.
  const [muted, setLocal] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const sync = () => setLocal(readMutedKinds());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(MUTED_KINDS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MUTED_KINDS_EVENT, sync);
    };
  }, []);

  const setMuted = useCallback((kind: string, isMuted: boolean) => {
    const next = readMutedKinds();
    if (isMuted) next.add(kind);
    else next.delete(kind);
    writeMutedKinds(next);
    setLocal(next);
  }, []);

  const isMuted = useCallback((kind: string) => muted.has(kind), [muted]);

  return { muted, isMuted, setMuted };
}
