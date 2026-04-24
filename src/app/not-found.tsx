"use client";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";

const NotFound = () => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_60%)]"
        aria-hidden
      />

      <header className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:px-12">
        <button
          onClick={handleGoHome}
          className="inline-flex cursor-pointer items-center transition-opacity duration-200 hover:opacity-80"
        >
          <BrandWordmark imageClassName="h-11" />
        </button>
      </header>

      <main className="flex flex-col items-center justify-center px-4 pb-[100px] pt-[40px] sm:px-6 sm:pt-[60px]">
        <div className="w-full text-center">
          <h1 className="mb-4 bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-[clamp(5rem,22vw,11rem)] font-bold leading-none tracking-tighter text-transparent dark:from-slate-100 dark:to-slate-500">
            404
          </h1>

          <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            This scene didn&apos;t make the cut.
          </h2>

          <p className="mx-auto max-w-[600px] text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            The page you&apos;re looking for wandered off between takes. Maybe
            a typo in the URL, maybe it got left on the cutting room floor.
            Either way, let&apos;s get you back.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-900 transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Home size={20} />
              Go Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
