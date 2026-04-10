"use client";

import { useEffect, useRef } from "react";
import { Card, CardDescription, CardTitle } from "@/components/cards-demo-3";

/**
 * AutoVideo — wrapper around <video> that explicitly calls .play() on mount.
 *
 * Some browsers (notably Safari and Firefox under certain conditions) refuse
 * to start the autoplay attribute when React first renders, then happily play
 * once the page is revisited from cache. Calling .play() inside a useEffect
 * after hydration forces the playback to start on the very first paint.
 */
const AutoVideo = (props: React.VideoHTMLAttributes<HTMLVideoElement>) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Defensive: make sure muted is set as a property, not just an attribute,
    // so the autoplay policy actually allows playback.
    el.muted = true;
    const promise = el.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {
        // Ignore — some browsers reject the play() promise on hidden tabs etc.
      });
    }
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      {...props}
    />
  );
};

export default function FeaturesSectionDemo() {
  const cardClassName =
    "!max-w-none !rounded-3xl !border-slate-200/80 !bg-white/80 !p-6 !shadow-sm !backdrop-blur-md dark:!border-slate-700/70 dark:!bg-slate-900/65";

  return (
    <section
      id="why-smart-advisor"
      className="scroll-mt-32 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
            Why Smart Advisor
          </p>
          <h2 className="mx-auto mt-3 max-w-5xl text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
            Built for picks you can trust
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base dark:text-slate-300">
            Private by design, fast by default, and open source so you can see
            how it works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Private Profile */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <AutoVideo
                src="/animations/security-status-safe.webm"
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Private Profile</CardTitle>
            <CardDescription>
              Your preferences stay tied to your account and are used to improve
              your picks.
            </CardDescription>
          </Card>

          {/* 2. Warp Speed */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <AutoVideo
                src="/animations/time-animation.webm"
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Warp Speed Results</CardTitle>
            <CardDescription>
              Quick results and smooth updates help you decide without waiting
              around.
            </CardDescription>
          </Card>

          {/* 3. Easy Trust */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <AutoVideo
                src="/animations/LOCK-WITH-GREEN-TICK.webm"
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Easy-To-Trust Picks</CardTitle>
            <CardDescription>
              Clear reasons make each suggestion easier to trust and choose,
              with open-source transparency.
            </CardDescription>
          </Card>

          {/* 4. Choose Both */}
          <Card className={cardClassName}>
            <div className="mt-5 flex h-[10rem] items-center justify-center gap-3">
              <AutoVideo
                src="/animations/Popcorn.webm"
                className="h-full w-auto max-w-[120px]"
              />
              <AutoVideo
                src="/animations/Books.webm"
                className="h-full w-auto max-w-[120px]"
              />
            </div>
            <CardTitle>Choose Across Both</CardTitle>
            <CardDescription>
              See book and movie results in one place so choosing feels faster
              and easier.
            </CardDescription>
          </Card>
        </div>
      </div>
    </section>
  );
}
