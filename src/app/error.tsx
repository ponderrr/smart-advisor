"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 p-4 shadow-sm dark:from-red-900/30 dark:to-rose-900/30">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">
          {isNetworkError ? "Can't reach our servers" : "Something broke"}
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          {isNetworkError
            ? "Check your connection and try again — we'll pick up right where you left off."
            : "An unexpected error stopped this page from loading. A refresh usually does it."}
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-600">
            Ref · {error.digest}
          </p>
        )}

        <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Home size={16} />
            Go home
          </a>
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
