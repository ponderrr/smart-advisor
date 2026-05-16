"use client";

import { useMemo } from "react";

import { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";

interface UseDashboardDataParams {
  recommendations: Recommendation[];
  libraryItems: LibraryItem[];
}

/**
 * Pure derived dashboard selectors. Extracted verbatim from
 * dashboard/page.tsx — every value here is a deterministic function of
 * the two source lists, so it carries no side effects and the data
 * fetching / mutation (handleMarkFinished) stays in the page.
 */
export function useDashboardData({
  recommendations,
  libraryItems,
}: UseDashboardDataParams) {
  const genreChartData = useMemo(() => {
    type Row = {
      genre: string;
      movie: number;
      book: number;
      music: number;
      total: number;
    };
    const byGenre = new Map<string, Row>();
    recommendations.forEach((rec) => {
      const genres =
        Array.isArray(rec.genres) && rec.genres.length > 0
          ? rec.genres
              .flatMap((g) => g.split(/[,&/|]/g))
              .map((g) => g.trim())
              .filter(Boolean)
          : ["Other"];
      genres.forEach((genre) => {
        const label =
          genre.length > 14 ? `${genre.slice(0, 14).trim()}…` : genre;
        const cur = byGenre.get(label) ?? {
          genre: label,
          movie: 0,
          book: 0,
          music: 0,
          total: 0,
        };
        if (rec.type === "movie") cur.movie += 1;
        if (rec.type === "book") cur.book += 1;
        if (rec.type === "music") cur.music += 1;
        cur.total += 1;
        byGenre.set(label, cur);
      });
    });
    return [...byGenre.values()].sort((a, b) => b.total - a.total).slice(0, 6);
  }, [recommendations]);

  /**
   * Per-format breakdowns — each one is a small standalone chart instead of
   * the previous stacked-bar mash-up. Five genres each, sorted by count, with
   * "Other" pre-filtered so the top of the chart is the user's actual taste.
   */
  const genreByFormat = useMemo(() => {
    type Format = "movie" | "book" | "music";
    const buckets: Record<Format, Map<string, number>> = {
      movie: new Map(),
      book: new Map(),
      music: new Map(),
    };

    recommendations.forEach((rec) => {
      if (rec.type !== "movie" && rec.type !== "book" && rec.type !== "music")
        return;
      const genres =
        Array.isArray(rec.genres) && rec.genres.length > 0
          ? rec.genres
              .flatMap((g) => g.split(/[,&/|]/g))
              .map((g) => g.trim())
              .filter(Boolean)
          : [];
      const seen = new Set<string>();
      genres.forEach((genre) => {
        const label =
          genre.length > 14 ? `${genre.slice(0, 14).trim()}…` : genre;
        if (seen.has(label.toLowerCase())) return;
        seen.add(label.toLowerCase());
        const bucket = buckets[rec.type as Format];
        bucket.set(label, (bucket.get(label) ?? 0) + 1);
      });
    });

    const topFive = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
      movie: topFive(buckets.movie),
      book: topFive(buckets.book),
      music: topFive(buckets.music),
    };
  }, [recommendations]);

  const stats = useMemo(() => {
    const movies = recommendations.filter((r) => r.type === "movie").length;
    const books = recommendations.filter((r) => r.type === "book").length;
    const music = recommendations.filter((r) => r.type === "music").length;
    const favorites = recommendations.filter((r) => r.is_favorited).length;
    return { total: recommendations.length, movies, books, music, favorites };
  }, [recommendations]);

  const lastPick = recommendations[0] ?? null;
  const lastLogged = libraryItems[0] ?? null;
  const ratedItems = useMemo(
    () => libraryItems.filter((i) => i.rating !== null).slice(0, 3),
    [libraryItems],
  );
  const inProgressItems = useMemo(
    () => libraryItems.filter((i) => i.status === "in_progress").slice(0, 6),
    [libraryItems],
  );

  const loggedTitleKeys = useMemo(
    () =>
      new Set(libraryItems.map((i) => `${i.medium}::${i.title.toLowerCase()}`)),
    [libraryItems],
  );
  const lastPickAlreadyLogged = lastPick
    ? loggedTitleKeys.has(`${lastPick.type}::${lastPick.title.toLowerCase()}`)
    : false;
  const topGenre = genreChartData[0] ?? null;

  const activity = useMemo(() => {
    const days = 14;
    const buckets = new Array(days).fill(0) as number[];
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    recommendations.forEach((rec) => {
      const t = new Date(rec.created_at).getTime();
      const dayIdx = Math.floor((startOfToday - t) / dayMs);
      if (dayIdx >= 0 && dayIdx < days) {
        buckets[days - 1 - dayIdx] += 1;
      }
    });
    const sevenDay = buckets.slice(-7).reduce((a, b) => a + b, 0);
    const prevSevenDay = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
    return { series: buckets, sevenDay, prevSevenDay };
  }, [recommendations]);

  const streak = useMemo(() => {
    const dayKey = (t: number) => {
      const d = new Date(t);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };
    const days = new Set<string>();
    recommendations.forEach((r) =>
      days.add(dayKey(new Date(r.created_at).getTime())),
    );
    libraryItems.forEach((i) =>
      days.add(dayKey(new Date(i.logged_at).getTime())),
    );
    if (days.size === 0) return 0;
    const oneDay = 86400000;
    const now = new Date();
    let cursor: Date | null;
    if (days.has(dayKey(now.getTime()))) {
      cursor = now;
    } else if (days.has(dayKey(now.getTime() - oneDay))) {
      cursor = new Date(now.getTime() - oneDay);
    } else {
      return 0;
    }
    let count = 0;
    while (days.has(dayKey(cursor.getTime()))) {
      count += 1;
      cursor = new Date(cursor.getTime() - oneDay);
    }
    return count;
  }, [recommendations, libraryItems]);

  const ratedCount = useMemo(
    () => libraryItems.filter((i) => i.rating !== null).length,
    [libraryItems],
  );

  return {
    genreChartData,
    genreByFormat,
    stats,
    lastPick,
    lastLogged,
    ratedItems,
    inProgressItems,
    loggedTitleKeys,
    lastPickAlreadyLogged,
    topGenre,
    activity,
    streak,
    ratedCount,
  };
}
