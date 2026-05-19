"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { Achievement } from "./use-achievements";

/**
 * Owns the milestone + tier "celebration" lifecycle: localStorage-backed
 * seen tracking so we only animate true transitions (not every page load),
 * the unlock/tier-complete toasts, and the transient "celebrating" sets
 * that drive the tile animations. Extracted verbatim from
 * dashboard/page.tsx; owns its own useTranslations("Dashboard.body")
 * (matching the page's tb).
 *
 * Returns only what the JSX consumes; refs/keys/setters for the celebrating
 * sets stay internal.
 */
export function useMilestoneCelebrations(achievements: {
  list: Achievement[];
  earned: number;
}) {
  const tb = useTranslations("Dashboard.body");

  // Track which milestones the user has already seen in their "unlocked"
  // state so we only animate true transitions (not every page load). On
  // first visit we seed the seen set with whatever's already earned so the
  // user doesn't get bombarded with celebrations for milestones they passed
  // long ago.
  const SEEN_MILESTONES_KEY = "smart_advisor_seen_milestones";
  const seenMilestonesRef = useRef<Set<string> | null>(null);
  const [celebratingMilestones, setCelebratingMilestones] = useState<
    Set<string>
  >(() => new Set());
  // Track which milestone is "open" (showing its how-to-unlock detail).
  // Null = none open. Tapping the open tile again closes it.
  const [openMilestoneId, setOpenMilestoneId] = useState<string | null>(null);

  // Tier-completion celebrations — same pattern as individual milestones,
  // but scoped to whole tiers (Easy / Medium / Hard / Master). Fires once
  // per tier when its last milestone unlocks.
  const SEEN_TIERS_KEY = "smart_advisor_seen_tier_completions";
  const seenTiersRef = useRef<Set<string> | null>(null);
  const [celebratingTiers, setCelebratingTiers] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (seenTiersRef.current !== null) return;

    const computeCompleteTiers = () => {
      const counts: Record<string, { total: number; earned: number }> = {};
      achievements.list.forEach((a) => {
        const bucket = counts[a.tier] ?? { total: 0, earned: 0 };
        bucket.total += 1;
        if (a.progress >= a.target) bucket.earned += 1;
        counts[a.tier] = bucket;
      });
      return new Set(
        Object.entries(counts)
          .filter(([, c]) => c.total > 0 && c.earned === c.total)
          .map(([tier]) => tier),
      );
    };

    const stored = window.localStorage.getItem(SEEN_TIERS_KEY);
    if (stored) {
      try {
        seenTiersRef.current = new Set(JSON.parse(stored) as string[]);
        return;
      } catch {
        // fall through and seed
      }
    }
    const initial = computeCompleteTiers();
    seenTiersRef.current = initial;
    window.localStorage.setItem(SEEN_TIERS_KEY, JSON.stringify([...initial]));
  }, [achievements.list]);

  useEffect(() => {
    if (seenTiersRef.current === null) return;

    const counts: Record<string, { total: number; earned: number }> = {};
    achievements.list.forEach((a) => {
      const bucket = counts[a.tier] ?? { total: 0, earned: 0 };
      bucket.total += 1;
      if (a.progress >= a.target) bucket.earned += 1;
      counts[a.tier] = bucket;
    });
    const nowComplete = Object.entries(counts)
      .filter(([, c]) => c.total > 0 && c.earned === c.total)
      .map(([tier]) => tier);
    const newlyComplete = nowComplete.filter(
      (tier) => !seenTiersRef.current!.has(tier),
    );
    if (newlyComplete.length === 0) return;

    newlyComplete.forEach((tier) => seenTiersRef.current!.add(tier));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SEEN_TIERS_KEY,
        JSON.stringify([...seenTiersRef.current!]),
      );
    }
    setCelebratingTiers((prev) => {
      const next = new Set(prev);
      newlyComplete.forEach((tier) => next.add(tier));
      return next;
    });
    newlyComplete.forEach((tier) => {
      toast.success(
        tb("milestones.tierCompleteToast", {
          tier: tb(`milestones.tiers.${tier}`),
        }),
      );
    });
    const timer = setTimeout(() => {
      setCelebratingTiers((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        newlyComplete.forEach((tier) => next.delete(tier));
        return next;
      });
    }, 2800);
    return () => clearTimeout(timer);
  }, [achievements.list, tb]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (seenMilestonesRef.current !== null) return;

    const stored = window.localStorage.getItem(SEEN_MILESTONES_KEY);
    if (stored) {
      try {
        seenMilestonesRef.current = new Set(JSON.parse(stored) as string[]);
        return;
      } catch {
        // fall through and seed
      }
    }
    // First visit — pretend everything currently earned has been seen so we
    // don't fire celebrations on existing achievements.
    const initial = new Set(
      achievements.list.filter((a) => a.progress >= a.target).map((a) => a.id),
    );
    seenMilestonesRef.current = initial;
    window.localStorage.setItem(
      SEEN_MILESTONES_KEY,
      JSON.stringify([...initial]),
    );
  }, [achievements.list]);

  useEffect(() => {
    if (seenMilestonesRef.current === null) return;
    const newlyEarned = achievements.list.filter(
      (a) => a.progress >= a.target && !seenMilestonesRef.current!.has(a.id),
    );
    if (newlyEarned.length === 0) return;

    newlyEarned.forEach((a) => seenMilestonesRef.current!.add(a.id));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SEEN_MILESTONES_KEY,
        JSON.stringify([...seenMilestonesRef.current!]),
      );
    }

    setCelebratingMilestones((prev) => {
      const next = new Set(prev);
      newlyEarned.forEach((a) => next.add(a.id));
      return next;
    });

    newlyEarned.forEach((a) => {
      toast.success(tb("milestones.unlockedToast", { label: a.label }));
    });

    const timer = setTimeout(() => {
      setCelebratingMilestones((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        newlyEarned.forEach((a) => next.delete(a.id));
        return next;
      });
    }, 2400);
    return () => clearTimeout(timer);
  }, [achievements.list, tb]);

  return {
    celebratingMilestones,
    celebratingTiers,
    openMilestoneId,
    setOpenMilestoneId,
  };
}
