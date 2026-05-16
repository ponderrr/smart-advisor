"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  BookCheck,
  BookOpen,
  Film,
  Flame,
  Heart,
  Music,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";

export type AchievementTier = "easy" | "medium" | "hard" | "master";
export type AchievementTone =
  | "indigo"
  | "violet"
  | "amber"
  | "rose"
  | "emerald"
  | "orange";

export interface Achievement {
  id: string;
  tier: AchievementTier;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: AchievementTone;
  progress: number;
  target: number;
}

export interface DashboardStats {
  total: number;
  movies: number;
  books: number;
  music: number;
  favorites: number;
}

interface UseAchievementsParams {
  recommendations: Recommendation[];
  libraryItems: LibraryItem[];
  stats: DashboardStats;
  ratedCount: number;
  streak: number;
}

/**
 * Builds the dashboard milestone/achievement list and earned count.
 * Extracted verbatim from dashboard/page.tsx; owns its own translations
 * (the "Dashboard.body" namespace, matching the page's `tb`) so callers
 * only pass the derived data.
 */
export function useAchievements({
  recommendations,
  libraryItems,
  stats,
  ratedCount,
  streak,
}: UseAchievementsParams): { list: Achievement[]; earned: number } {
  const tb = useTranslations("Dashboard.body");

  return useMemo(() => {
    const uniqueGenres = new Set<string>();
    recommendations.forEach((r) => {
      (r.genres ?? []).forEach((g) => {
        if (g) uniqueGenres.add(g.toLowerCase().trim());
      });
    });
    const finishedCount = libraryItems.filter(
      (i) => i.status === "finished",
    ).length;
    const list = [
      // ---------------- EASY ----------------
      {
        id: "first-pick",
        tier: "easy" as const,
        label: tb("milestones.items.firstPick"),
        description: tb("milestones.descriptions.firstPick"),
        icon: Sparkles,
        tone: "indigo" as const,
        progress: stats.total,
        target: 1,
      },
      {
        id: "ten-picks",
        tier: "easy" as const,
        label: tb("milestones.items.tenPicks"),
        description: tb("milestones.descriptions.tenPicks"),
        icon: TrendingUp,
        tone: "indigo" as const,
        progress: stats.total,
        target: 10,
      },
      {
        id: "wide-taste",
        tier: "easy" as const,
        label: tb("milestones.items.wideTaste"),
        description: tb("milestones.descriptions.wideTaste"),
        icon: BarChart3,
        tone: "violet" as const,
        progress: uniqueGenres.size,
        target: 5,
      },
      {
        id: "cinephile",
        tier: "easy" as const,
        label: tb("milestones.items.cinephile"),
        description: tb("milestones.descriptions.cinephile"),
        icon: Film,
        tone: "amber" as const,
        progress: stats.movies,
        target: 10,
      },
      {
        id: "bookworm",
        tier: "easy" as const,
        label: tb("milestones.items.bookworm"),
        description: tb("milestones.descriptions.bookworm"),
        icon: BookOpen,
        tone: "amber" as const,
        progress: stats.books,
        target: 10,
      },
      {
        id: "melomaniac",
        tier: "easy" as const,
        label: tb("milestones.items.melomaniac"),
        description: tb("milestones.descriptions.melomaniac"),
        icon: Music,
        tone: "rose" as const,
        progress: stats.music,
        target: 10,
      },
      {
        id: "curator",
        tier: "easy" as const,
        label: tb("milestones.items.curator"),
        description: tb("milestones.descriptions.curator"),
        icon: Heart,
        tone: "rose" as const,
        progress: stats.favorites,
        target: 5,
      },
      {
        id: "reflective",
        tier: "easy" as const,
        label: tb("milestones.items.reflective"),
        description: tb("milestones.descriptions.reflective"),
        icon: ThumbsUp,
        tone: "emerald" as const,
        progress: ratedCount,
        target: 5,
      },
      // ---------------- MEDIUM ----------------
      {
        id: "twenty-five-picks",
        tier: "medium" as const,
        label: tb("milestones.items.twentyFivePicks"),
        description: tb("milestones.descriptions.twentyFivePicks"),
        icon: TrendingUp,
        tone: "indigo" as const,
        progress: stats.total,
        target: 25,
      },
      {
        id: "genre-explorer",
        tier: "medium" as const,
        label: tb("milestones.items.genreExplorer"),
        description: tb("milestones.descriptions.genreExplorer"),
        icon: BarChart3,
        tone: "violet" as const,
        progress: uniqueGenres.size,
        target: 10,
      },
      {
        id: "librarian",
        tier: "medium" as const,
        label: tb("milestones.items.librarian"),
        description: tb("milestones.descriptions.librarian"),
        icon: BookCheck,
        tone: "emerald" as const,
        progress: libraryItems.length,
        target: 20,
      },
      {
        id: "completionist",
        tier: "medium" as const,
        label: tb("milestones.items.completionist"),
        description: tb("milestones.descriptions.completionist"),
        icon: Trophy,
        tone: "amber" as const,
        progress: finishedCount,
        target: 10,
      },
      {
        id: "critic",
        tier: "medium" as const,
        label: tb("milestones.items.critic"),
        description: tb("milestones.descriptions.critic"),
        icon: ThumbsUp,
        tone: "emerald" as const,
        progress: ratedCount,
        target: 25,
      },
      {
        id: "week-streak",
        tier: "medium" as const,
        label: tb("milestones.items.weekStreak"),
        description: tb("milestones.descriptions.weekStreak"),
        icon: Flame,
        tone: "orange" as const,
        progress: streak,
        target: 7,
      },
      // ---------------- HARD ----------------
      {
        id: "half-century",
        tier: "hard" as const,
        label: tb("milestones.items.halfCentury"),
        description: tb("milestones.descriptions.halfCentury"),
        icon: TrendingUp,
        tone: "indigo" as const,
        progress: stats.total,
        target: 50,
      },
      {
        id: "centurion",
        tier: "hard" as const,
        label: tb("milestones.items.centurion"),
        description: tb("milestones.descriptions.centurion"),
        icon: Trophy,
        tone: "indigo" as const,
        progress: stats.total,
        target: 100,
      },
      {
        id: "cinema-master",
        tier: "hard" as const,
        label: tb("milestones.items.cinemaMaster"),
        description: tb("milestones.descriptions.cinemaMaster"),
        icon: Film,
        tone: "amber" as const,
        progress: stats.movies,
        target: 50,
      },
      {
        id: "voracious",
        tier: "hard" as const,
        label: tb("milestones.items.voracious"),
        description: tb("milestones.descriptions.voracious"),
        icon: BookOpen,
        tone: "amber" as const,
        progress: stats.books,
        target: 50,
      },
      {
        id: "audiophile",
        tier: "hard" as const,
        label: tb("milestones.items.audiophile"),
        description: tb("milestones.descriptions.audiophile"),
        icon: Music,
        tone: "rose" as const,
        progress: stats.music,
        target: 50,
      },
      {
        id: "genre-master",
        tier: "hard" as const,
        label: tb("milestones.items.genreMaster"),
        description: tb("milestones.descriptions.genreMaster"),
        icon: BarChart3,
        tone: "violet" as const,
        progress: uniqueGenres.size,
        target: 20,
      },
      {
        id: "maven",
        tier: "hard" as const,
        label: tb("milestones.items.maven"),
        description: tb("milestones.descriptions.maven"),
        icon: Heart,
        tone: "rose" as const,
        progress: stats.favorites,
        target: 25,
      },
      {
        id: "marathon",
        tier: "hard" as const,
        label: tb("milestones.items.marathon"),
        description: tb("milestones.descriptions.marathon"),
        icon: Flame,
        tone: "orange" as const,
        progress: streak,
        target: 30,
      },
      // ---------------- MASTER ----------------
      {
        id: "legend",
        tier: "master" as const,
        label: tb("milestones.items.legend"),
        description: tb("milestones.descriptions.legend"),
        icon: Trophy,
        tone: "indigo" as const,
        progress: stats.total,
        target: 250,
      },
      {
        id: "movie-mogul",
        tier: "master" as const,
        label: tb("milestones.items.movieMogul"),
        description: tb("milestones.descriptions.movieMogul"),
        icon: Film,
        tone: "amber" as const,
        progress: stats.movies,
        target: 100,
      },
      {
        id: "library-royal",
        tier: "master" as const,
        label: tb("milestones.items.libraryRoyal"),
        description: tb("milestones.descriptions.libraryRoyal"),
        icon: BookOpen,
        tone: "amber" as const,
        progress: stats.books,
        target: 100,
      },
      {
        id: "music-mogul",
        tier: "master" as const,
        label: tb("milestones.items.musicMogul"),
        description: tb("milestones.descriptions.musicMogul"),
        icon: Music,
        tone: "rose" as const,
        progress: stats.music,
        target: 100,
      },
      {
        id: "polymath",
        tier: "master" as const,
        label: tb("milestones.items.polymath"),
        description: tb("milestones.descriptions.polymath"),
        icon: BarChart3,
        tone: "violet" as const,
        progress: uniqueGenres.size,
        target: 30,
      },
      {
        id: "patron",
        tier: "master" as const,
        label: tb("milestones.items.patron"),
        description: tb("milestones.descriptions.patron"),
        icon: Heart,
        tone: "rose" as const,
        progress: stats.favorites,
        target: 50,
      },
      {
        id: "tastemaker",
        tier: "master" as const,
        label: tb("milestones.items.tastemaker"),
        description: tb("milestones.descriptions.tastemaker"),
        icon: ThumbsUp,
        tone: "emerald" as const,
        progress: ratedCount,
        target: 100,
      },
      {
        id: "year-long",
        tier: "master" as const,
        label: tb("milestones.items.yearLong"),
        description: tb("milestones.descriptions.yearLong"),
        icon: Flame,
        tone: "orange" as const,
        progress: streak,
        target: 365,
      },
    ];
    const earned = list.filter((a) => a.progress >= a.target).length;
    return { list, earned };
  }, [recommendations, stats, ratedCount, streak, libraryItems, tb]);
}
