import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ShareTargetPageProps {
  searchParams: Promise<{
    title?: string | string[];
    text?: string | string[];
    url?: string | string[];
  }>;
}

const first = (v?: string | string[]) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || "";

/**
 * Web Share Target handler. Other apps share a title/link into Smart
 * Advisor (configured in `manifest.ts`); the shared fields arrive here as
 * GET query params. The quiz is a multi-step personality flow with no
 * single-title seed, so rather than fake a recommendation we acknowledge
 * what was shared and hand the user into the normal quiz.
 */
export default async function ShareTargetPage({
  searchParams,
}: ShareTargetPageProps) {
  const t = await getTranslations("ShareTarget");
  const params = await searchParams;

  const title = first(params.title);
  const text = first(params.text);
  const url = first(params.url);
  // Apps are inconsistent: some put the link in `url`, some inline it in
  // `text`, some only send a title. Show the most descriptive thing.
  const shared = title || text || url;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-16 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
          {t("eyebrow")}
        </p>

        {shared ? (
          <>
            <h1 className="mt-2 text-2xl font-black tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("subtitle")}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/70 dark:bg-slate-800/50">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {t("sharedLabel")}
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                {shared}
              </p>
              {url && url !== shared ? (
                <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                  {url}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-2xl font-black tracking-tight">
              {t("emptyTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("emptySubtitle")}
            </p>
          </>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/quiz"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
          >
            <Sparkles size={15} />
            {t("startQuiz")}
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {t("goDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
