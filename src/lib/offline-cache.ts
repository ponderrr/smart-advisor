/**
 * Tiny last-good-snapshot cache for list pages. After a successful fetch
 * the rows are stashed in localStorage; when a later fetch fails (offline,
 * flaky network) the page can fall back to the snapshot instead of an
 * empty/error state. Parity with the mobile OfflineCache helper.
 */

const PREFIX = "smart_advisor_offline_cache:";

export function cacheWrite<T>(key: string, rows: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(rows));
  } catch {
    // Best-effort — a full / disabled localStorage must never break a fetch.
  }
}

export function cacheRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
