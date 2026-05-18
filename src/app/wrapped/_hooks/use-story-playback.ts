"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { STEPS, STEP_DURATION_MS } from "../_lib/story";

const SWIPE_THRESHOLD = 50;

/**
 * Story playback state machine for the wrapped "Year in Review": step
 * index (resets to intro on year change), auto-advance timer, keyboard
 * nav, and touch-swipe. Extracted verbatim from wrapped/page.tsx.
 *
 * `paused` should be true while a blocking overlay (share dialog / year
 * picker) is open so auto-advance and key handling stand down.
 */
export function useStoryPlayback({
  year,
  paused,
}: {
  year: number;
  paused: boolean;
}) {
  const router = useRouter();

  // Step index. Year change resets to intro so the story restarts from
  // the top whenever the user picks a different year.
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    setStepIdx(0);
  }, [year]);

  // Auto-advance kicks in once the user has moved past the intro. Outro
  // stops the chain so the final card stays put for the share CTA.
  const isPlaying = stepIdx > 0 && stepIdx < STEPS.length - 1;

  const totalSteps = STEPS.length;
  const goNext = useCallback(() => {
    setStepIdx((i) => Math.min(totalSteps - 1, i + 1));
  }, [totalSteps]);
  const goBack = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);
  const exit = useCallback(() => {
    router.push("/feed");
  }, [router]);
  const restart = useCallback(() => setStepIdx(0), []);

  // Auto-advance timer. Cleared on step change, paused overlay, or
  // unmount. Skipping manually (click/key) resets it.
  useEffect(() => {
    if (!isPlaying) return;
    if (paused) return;
    const timer = window.setTimeout(goNext, STEP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [stepIdx, isPlaying, paused, goNext]);

  // Keyboard navigation across the whole story.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (paused) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goBack, exit, paused]);

  // Touch swipe — track start X and decide on touchend.
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (delta < -SWIPE_THRESHOLD) goNext();
    else if (delta > SWIPE_THRESHOLD) goBack();
    touchStartX.current = null;
  };

  return {
    stepIdx,
    isPlaying,
    totalSteps,
    goNext,
    goBack,
    exit,
    restart,
    handleTouchStart,
    handleTouchEnd,
  };
}
