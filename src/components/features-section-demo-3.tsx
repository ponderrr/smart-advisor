"use client";

import React from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/cards-demo-3";

export default function FeaturesSectionDemo() {
  const cardClassName =
    "!max-w-none !rounded-3xl !border-slate-200/80 !bg-white/80 !p-6 !shadow-sm !backdrop-blur-md dark:!border-slate-700/70 dark:!bg-slate-900/65";

  return (
    <section id="why-smart-advisor" className="scroll-mt-32 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="mx-auto max-w-5xl text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
            Why Use Smart Advisor
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base dark:text-slate-300">
            Private by design, fast by default, and open source so you can see how it works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. SECURE LOCK (Snap & Bounce) */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <CardVideo src="/animations/lock-with-green-tick.webm" tilt="-2deg" />
            </div>
            <CardTitle>Private Profile</CardTitle>
            <CardDescription>
              Your preferences stay tied to your account and are used to improve your picks.
            </CardDescription>
          </Card>

          {/* 2. DATA FLOW (Elastic Bars) */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <CardVideo src="/animations/Sandy%20Loading.webm" />
            </div>
            <CardTitle>Warp Speed Results</CardTitle>
            <CardDescription>
              Quick results and smooth updates help you decide without waiting around.
            </CardDescription>
          </Card>

          {/* 3. SHIELD (Pulse & Rotate) */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <CardVideo src="/animations/security-status-safe.webm" tilt="2deg" />
            </div>
            <CardTitle>Easy-To-Trust Picks</CardTitle>
            <CardDescription>
              Clear reasons make each suggestion easier to trust and choose, with open-source transparency.
            </CardDescription>
          </Card>

          {/* 4. RADAR (Ping & Seek) */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <CombinedResultsVideo />
            </div>
            <CardTitle>Choose Across Both</CardTitle>
            <CardDescription>
              See book and movie results in one place so choosing feels faster and easier.
            </CardDescription>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardVideo = ({ src, tilt = "0deg" }: { src: string; tilt?: string }) => {
  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="h-full w-full max-w-[180px] rounded-xl object-cover [filter:saturate(1.05)_brightness(1.02)] dark:[filter:saturate(0.95)_brightness(0.92)_contrast(1.08)]"
      style={{ transform: `rotate(${tilt})` }}
    />
  );
};

const CombinedResultsVideo = () => {
  return (
    <div className="grid w-full max-w-[280px] grid-cols-2 gap-4">
      <div className="overflow-hidden rounded-xl">
        <video
          src="/animations/Books.webm"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-28 w-full object-cover"
        />
      </div>
      <div className="overflow-hidden rounded-xl">
        <video
          src="/animations/Popcorn.webm"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-28 w-full object-cover"
        />
      </div>
    </div>
  );
};
