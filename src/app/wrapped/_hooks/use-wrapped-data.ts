"use client";

import { useEffect, useMemo, useState } from "react";

import { databaseService } from "@/features/recommendations/services/database-service";
import { libraryService } from "@/features/library/services/library-service";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";
import type { StoryStats } from "../_lib/story";

interface UseWrappedDataParams {
  ready: boolean;
  year: number;
  currentYear: number;
}

/**
 * Owns the wrapped data fetch (all-time recs + library) and the pure
 * year-scoped derivations: the set of years that have data, and the full
 * StoryStats roll-up. Extracted verbatim from wrapped/page.tsx — the page
 * consumes only loading/availableYears/stats, so the raw lists stay
 * internal here.
 */
export function useWrappedData({
  ready,
  year,
  currentYear,
}: UseWrappedDataParams) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: recs }, { data: lib }] = await Promise.all([
        databaseService.getUserRecommendations({
          sortBy: "newest",
          limit: 5000,
        }),
        libraryService.list(),
      ]);
      if (cancelled) return;
      setRecommendations(recs);
      setLibraryItems(lib);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    recommendations.forEach((r) =>
      set.add(new Date(r.created_at).getFullYear()),
    );
    libraryItems.forEach((i) => set.add(new Date(i.logged_at).getFullYear()));
    if (set.size === 0) set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [recommendations, libraryItems, currentYear]);

  const stats = useMemo<StoryStats>(() => {
    const yearRecs = recommendations.filter(
      (r) => new Date(r.created_at).getFullYear() === year,
    );
    const yearLibrary = libraryItems.filter(
      (i) => new Date(i.logged_at).getFullYear() === year,
    );

    const movies = yearRecs.filter((r) => r.type === "movie").length;
    const books = yearRecs.filter((r) => r.type === "book").length;
    const music = yearRecs.filter((r) => r.type === "music").length;
    const favorites = yearRecs.filter((r) => r.is_favorited).length;
    const watchHours = Math.round((movies * 110) / 60);

    const genreCounts = new Map<string, number>();
    yearRecs.forEach((r) => {
      (r.genres ?? []).forEach((g) => {
        const k = g.trim();
        if (!k) return;
        genreCounts.set(k, (genreCounts.get(k) ?? 0) + 1);
      });
    });
    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const creatorCounts = new Map<
      string,
      { name: string; type: "director" | "author" | "artist"; count: number }
    >();
    yearRecs.forEach((r) => {
      const name = r.director || r.author || r.artist;
      if (!name) return;
      const role: "director" | "author" | "artist" = r.director
        ? "director"
        : r.author
          ? "author"
          : "artist";
      const key = `${role}::${name.toLowerCase()}`;
      const cur = creatorCounts.get(key) ?? { name, type: role, count: 0 };
      cur.count += 1;
      creatorCounts.set(key, cur);
    });
    const topCreator =
      [...creatorCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null;

    const monthly = new Array(12).fill(0) as number[];
    yearRecs.forEach((r) => {
      const m = new Date(r.created_at).getMonth();
      monthly[m] += 1;
    });
    const peakMonth = monthly.reduce(
      (best, count, idx) => (count > best.count ? { idx, count } : best),
      { idx: 0, count: 0 },
    );

    const dayKeys = new Set<string>();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    yearRecs.forEach((r) => dayKeys.add(fmt(new Date(r.created_at))));
    yearLibrary.forEach((i) => dayKeys.add(fmt(new Date(i.logged_at))));
    const startOfYear = new Date(year, 0, 1);
    const endOfYear =
      year === currentYear ? new Date() : new Date(year, 11, 31);
    let longest = 0;
    let run = 0;
    const oneDay = 86400000;
    for (
      let tDay = startOfYear.getTime();
      tDay <= endOfYear.getTime();
      tDay += oneDay
    ) {
      if (dayKeys.has(fmt(new Date(tDay)))) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }

    const topPicks = [...yearRecs]
      .sort((a, b) => {
        if (a.is_favorited === b.is_favorited)
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        return a.is_favorited ? -1 : 1;
      })
      .slice(0, 6);

    // Poster pools. Favorites first so the most "earned" covers appear
    // when we sample a few; skip records without poster_url since they'd
    // render as a blank tile.
    const sortedForPosters = [...yearRecs].sort((a, b) => {
      if (a.is_favorited === b.is_favorited) return 0;
      return a.is_favorited ? -1 : 1;
    });
    const moviePosters = sortedForPosters
      .filter((r) => r.type === "movie" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);
    const bookPosters = sortedForPosters
      .filter((r) => r.type === "book" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);
    const musicPosters = sortedForPosters
      .filter((r) => r.type === "music" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);

    const creatorPosters = topCreator
      ? sortedForPosters
          .filter((r) => {
            const name = r.director || r.author || r.artist;
            return (
              name && name.toLowerCase() === topCreator.name.toLowerCase()
            );
          })
          .filter((r) => r.poster_url)
          .slice(0, 6)
          .map((r) => r.poster_url as string)
      : [];

    const allPosters = sortedForPosters
      .filter((r) => r.poster_url)
      .slice(0, 24)
      .map((r) => r.poster_url as string);

    return {
      total: yearRecs.length,
      movies,
      books,
      music,
      favorites,
      watchHours,
      topGenres,
      topCreator,
      monthly,
      peakMonth,
      longest,
      topPicks,
      libraryLogged: yearLibrary.length,
      moviePosters,
      bookPosters,
      musicPosters,
      creatorPosters,
      allPosters,
    };
  }, [recommendations, libraryItems, year, currentYear]);

  return { loading, availableYears, stats };
}
