"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { FileUpload } from "@/components/ui/file-upload";
import { PillButton } from "@/components/ui/pill-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { libraryService } from "@/features/library/services/library-service";
import type { LogLibraryInput } from "@/features/library/types/library";
import {
  detectSource,
  ImportFormatError,
  parseCsv,
  type ImportResult,
  type ImportSource,
} from "@/features/library/services/watchlist-import";
import { cn } from "@/lib/utils";

/** Import rows in small concurrent batches so a large Goodreads export
 *  doesn't crawl, while keeping the idempotent per-row upsert semantics. */
const BATCH_SIZE = 6;

type Phase = "pick" | "preview" | "importing" | "done";

const ImportPage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const t = useTranslations("Library.import");
  const tc = useTranslations("Common");

  const [source, setSource] = useState<ImportSource>("letterboxd");
  const [phase, setPhase] = useState<Phase>("pick");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<LogLibraryInput[]>([]);
  const [mismatch, setMismatch] = useState<ImportSource | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  // Bumped on reset to remount FileUpload (it owns its own file state).
  const [uploadKey, setUploadKey] = useState(0);

  if (!ready) {
    return <PageLoader text={tc("loading")} />;
  }

  const handleFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error(t("errors.read"));
      return;
    }
    try {
      const rows = parseCsv(text, source);
      if (rows.length === 0) {
        toast.error(t("errors.empty"));
        return;
      }
      const detected = detectSource(text);
      setMismatch(detected && detected !== source ? detected : null);
      setFileName(file.name);
      setParsed(rows);
      setPhase("preview");
    } catch (err) {
      toast.error(
        err instanceof ImportFormatError ? err.message : t("errors.parse"),
      );
    }
  };

  const runImport = async () => {
    setPhase("importing");
    setProgress(0);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const batch = parsed.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          if (row.title.trim().length === 0) {
            skipped++;
            return;
          }
          try {
            const { error } = await libraryService.log(row);
            if (error) failed++;
            else imported++;
          } catch {
            failed++;
          }
        }),
      );
      setProgress(Math.min(i + BATCH_SIZE, parsed.length));
    }
    setResult({ imported, skipped, failed });
    setPhase("done");
  };

  const reset = () => {
    setPhase("pick");
    setParsed([]);
    setFileName(null);
    setMismatch(null);
    setProgress(0);
    setResult(null);
    setUploadKey((k) => k + 1);
  };

  const pct =
    parsed.length > 0 ? Math.round((progress / parsed.length) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-[760px]">
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={15} />
            {t("back")}
          </button>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:border-slate-700/60 dark:bg-slate-900/60">
            {phase === "pick" && (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t("sourceLabel")}
                  </p>
                  <SegmentedControl<ImportSource>
                    layoutId="import-source"
                    value={source}
                    onChange={setSource}
                    ariaLabel={t("sourceLabel")}
                    options={[
                      {
                        value: "letterboxd",
                        label: t("sources.letterboxd"),
                        pillClassName: "bg-amber-500",
                      },
                      {
                        value: "goodreads",
                        label: t("sources.goodreads"),
                        pillClassName: "bg-emerald-500",
                      },
                    ]}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t(`hint.${source}`)}
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <FileUpload
                    key={uploadKey}
                    onChange={(files) => {
                      const f = files[0];
                      if (f) void handleFile(f);
                    }}
                  />
                </div>
              </div>
            )}

            {phase === "preview" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <FileText size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-tight">
                      {fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("preview", { count: parsed.length })}
                    </p>
                  </div>
                </div>

                {mismatch && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300">
                    <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      {t("mismatch", {
                        detected: t(`sources.${mismatch}`),
                        chosen: t(`sources.${source}`),
                      })}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t("chooseDifferent")}
                  </button>
                  <PillButton
                    onClick={() => void runImport()}
                    className="inline-flex items-center justify-center gap-1.5 border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-2 text-sm font-black tracking-tight text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <Upload size={15} />
                    {t("importCta", { count: parsed.length })}
                  </PillButton>
                </div>
              </div>
            )}

            {phase === "importing" && (
              <div className="space-y-4 py-4">
                <p className="text-center text-sm font-bold tracking-tight">
                  {t("importing", {
                    done: Math.min(progress, parsed.length),
                    total: parsed.length,
                  })}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>
            )}

            {phase === "done" && result && (
              <div className="space-y-5 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 size={28} />
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    {t("doneTitle")}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {t("doneSummary", {
                      imported: result.imported,
                      skipped: result.skipped,
                      failed: result.failed,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors",
                      "hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    {t("importAnother")}
                  </button>
                  <PillButton
                    onClick={() => router.push("/library")}
                    className="inline-flex items-center justify-center gap-1.5 border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-2 text-sm font-black tracking-tight text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {t("goToLibrary")}
                  </PillButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ImportPage;
