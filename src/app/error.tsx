"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTranslations } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("System.error");
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  const isNetworkError =
    error.message?.includes("fetch") ||
    error.message?.includes("network") ||
    error.message?.includes("RSC") ||
    error.message?.includes("Failed to fetch");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.10),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.16),_transparent_60%)]"
        aria-hidden
      />

      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-12 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300">
          <AlertTriangle className="h-9 w-9" />
        </div>

        <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">
          {isNetworkError ? t("networkTitle") : t("genericTitle")}
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          {isNetworkError ? t("networkBody") : t("genericBody")}
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-600">
            {t("ref")} · {error.digest}
          </p>
        )}

        <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-6 text-sm font-bold tracking-tight text-slate-700 backdrop-blur-md transition hover:border-slate-300 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
          >
            <Home size={16} />
            {t("goHome")}
          </Link>
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-500/10 px-6 text-sm font-bold tracking-tight text-violet-600 transition hover:bg-violet-500/15 dark:bg-violet-400/15 dark:text-violet-300 dark:hover:bg-violet-400/20"
          >
            <RefreshCw size={16} />
            {t("tryAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
