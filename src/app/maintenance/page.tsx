import type { Metadata } from "next";
import { BrandWordmark } from "@/components/brand-wordmark";

export const metadata: Metadata = {
  title: "Out to lunch — Smart Advisor",
  description:
    "Smart Advisor is currently undergoing scheduled maintenance. We'll be back shortly.",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_60%)]"
        aria-hidden
      />

      <header className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:px-12">
        <BrandWordmark imageClassName="h-11" />
      </header>

      <main className="flex flex-col items-center justify-center px-4 pb-[100px] pt-[60px] sm:px-6 sm:pt-[100px]">
        <div className="w-full text-center">
          <div
            className="mb-8 flex items-center justify-center gap-2"
            aria-hidden
          >
            <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500" />
          </div>

          <h1 className="mb-5 whitespace-nowrap text-[clamp(1.5rem,7.5vw,4.5rem)] font-bold leading-tight tracking-tight">
            Our AI is at the movies.
          </h1>
          <p className="mx-auto max-w-[640px] text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            Smart Advisor stepped out to binge a few classics and skim a novel
            or two. We&apos;ll be back shortly with fresher taste.
          </p>
        </div>
      </main>
    </div>
  );
}
