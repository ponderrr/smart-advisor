"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          {isNetworkError
            ? "A network error occurred. Please check your connection and try again."
            : "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
