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
    <div className="min-h-[100svh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:px-12">
        <button
          onClick={handleGoHome}
          className="inline-flex cursor-pointer items-center transition-opacity duration-200 hover:opacity-80"
        >
          <BrandWordmark imageClassName="h-11" />
        </button>
      </header>

      <main className="flex flex-col items-center justify-center px-4 pb-[100px] pt-[80px] sm:px-6 sm:pt-[120px]">
        <div className="max-w-[600px] text-center">
          <h1 className="mb-6 text-6xl font-bold tracking-tighter md:text-8xl">
            404
          </h1>
          <h2 className="mb-4 text-2xl font-semibold md:text-3xl">
            Page Not Found
          </h2>
          <p className="mb-12 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            Sorry, the page you&apos;re looking for doesn&apos;t exist. It might
            have been moved, deleted, or you entered the wrong URL.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
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
