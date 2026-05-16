"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNowStrict } from "date-fns";

import { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";
import type { DashboardStats } from "./use-achievements";

interface UseDashboardCopyParams {
  user: { username?: string | null; name?: string | null } | null | undefined;
  loading: boolean;
  stats: DashboardStats;
  activity: { series: number[]; sevenDay: number; prevSevenDay: number };
  recommendations: Recommendation[];
  libraryItems: LibraryItem[];
  lastPick: Recommendation | null;
}

/**
 * Derives the dashboard's contextual copy — greeting name, the activity
 * "header hook" line, the single contextual suggestion nudge, and the
 * Dec/Jan year-in-review season flag. Extracted verbatim from
 * dashboard/page.tsx; owns its own useTranslations("Dashboard.body").
 */
export function useDashboardCopy({
  user,
  loading,
  stats,
  activity,
  recommendations,
  libraryItems,
  lastPick,
}: UseDashboardCopyParams) {
  const tb = useTranslations("Dashboard.body");

  const greetName = useMemo(() => {
    const username = user?.username?.trim();
    if (username) return username;
    const name = user?.name?.trim();
    if (!name) return "";
    return name.split(/\s+/)[0];
  }, [user?.username, user?.name]);

  // Year-in-review surfaces only during Dec (wrap up the current year) and
  // January (look back at the year that just ended). Computed in an effect so
  // SSR can't disagree with the client's local time.
  const [wrappedSeason, setWrappedSeason] = useState<{
    show: boolean;
    year: number;
  }>({ show: false, year: new Date().getFullYear() });
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    if (month === 11) {
      setWrappedSeason({ show: true, year: now.getFullYear() });
    } else if (month === 0) {
      setWrappedSeason({ show: true, year: now.getFullYear() - 1 });
    } else {
      setWrappedSeason({ show: false, year: now.getFullYear() });
    }
  }, []);

  const headerHook = useMemo(() => {
    if (loading) return tb("headerHook.loading");
    if (stats.total === 0) return tb("headerHook.empty");
    if (activity.sevenDay === 0) return tb("headerHook.quietWeek");
    const delta = activity.sevenDay - activity.prevSevenDay;
    if (delta > 0) return tb("headerHook.up", { n: activity.sevenDay, delta });
    if (delta < 0)
      return tb("headerHook.down", { n: activity.sevenDay, delta: -delta });
    return tb("headerHook.flat", { n: activity.sevenDay });
  }, [loading, stats.total, activity, tb]);

  /**
   * Pick a single contextual nudge based on user state. Order matters —
   * we surface the most actionable next step first.
   */
  const suggestion = useMemo(() => {
    if (loading) return null;
    if (recommendations.length === 0) {
      return {
        title: tb("suggestion.firstQuiz.title"),
        body: tb("suggestion.firstQuiz.body"),
        cta: tb("suggestion.firstQuiz.cta"),
        href: "/quiz",
      };
    }
    if (libraryItems.length === 0) {
      return {
        title: tb("suggestion.logReaction.title"),
        body: tb("suggestion.logReaction.body"),
        cta: tb("suggestion.logReaction.cta"),
        href: "/results",
      };
    }
    if (lastPick) {
      const ageDays =
        (Date.now() - new Date(lastPick.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (ageDays > 7) {
        return {
          title: tb("suggestion.anotherPick.title"),
          body: tb("suggestion.anotherPick.body", {
            ago: formatDistanceToNowStrict(new Date(lastPick.created_at)),
            count: libraryItems.length,
          }),
          cta: tb("suggestion.anotherPick.cta"),
          href: "/quiz",
        };
      }
    }
    return null;
  }, [loading, recommendations.length, libraryItems.length, lastPick, tb]);

  return { greetName, headerHook, suggestion, wrappedSeason };
}
