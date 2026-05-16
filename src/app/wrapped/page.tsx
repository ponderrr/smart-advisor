"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  QrCode,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMessages, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";

import { Dialog } from "@/components/ui/dialog";
import { PageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import {
  FALLBACK_MONTHS,
  STEPS,
  stepBackgrounds,
  type StoryStep,
  type StoryStats,
} from "./_lib/story";
import {
  PosterMosaic,
  StoryChrome,
  IntroCard,
  TotalCard,
  FormatCard,
  GenresCard,
  CreatorCard,
  StandoutCard,
  PicksCard,
  OutroCard,
} from "./_components/story-cards";
import { useWrappedData } from "./_hooks/use-wrapped-data";
import { useStoryPlayback } from "./_hooks/use-story-playback";
import { useWrappedShare } from "./_hooks/use-wrapped-share";

const WrappedPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const t = useTranslations("Wrapped");
  const messages = useMessages() as { Wrapped?: { months?: string[] } };
  const monthLabels = messages.Wrapped?.months ?? FALLBACK_MONTHS;

  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const [year, setYear] = useQueryState(
    "y",
    parseAsInteger.withDefault(defaultYear),
  );

  const { loading, availableYears, stats } = useWrappedData({
    ready,
    year,
    currentYear,
  });

  const {
    showShare,
    setShowShare,
    shareToken,
    shareTokenLoading,
    canNativeShare,
    shareUrl,
    handleOpenShare,
    handleCopyShareLink,
    handleNativeShareLink,
  } = useWrappedShare(year);

  // Year picker dropdown (rendered as a chip in the chrome).
  const [showYearPicker, setShowYearPicker] = useState(false);

  const {
    stepIdx,
    isPlaying,
    totalSteps,
    goNext,
    goBack,
    exit,
    restart,
    handleTouchStart,
    handleTouchEnd,
  } = useStoryPlayback({
    year,
    paused: showShare || showYearPicker,
  });

  if (!ready || loading) return <PageLoader text={t("loading")} />;

  const displayName =
    user?.username || user?.name?.split(/\s+/)[0] || t("fallbackName");

  // Empty year: keep the existing card empty state. Story mode doesn't
  // make sense with zero data, and this is consistent with the dashboard
  // version we're replacing.
  if (stats.total === 0) {
    return (
      <div className="relative flex min-h-[100svh] flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <StoryChrome
          year={year}
          availableYears={availableYears}
          onPickYear={setYear}
          showYearPicker={showYearPicker}
          setShowYearPicker={setShowYearPicker}
          onShare={handleOpenShare}
          onExit={exit}
          currentStep={0}
          totalSteps={totalSteps}
          tStory={t}
          showProgress={false}
          isPlaying={false}
        />
        <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-24 sm:px-6">
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300/80 bg-white/60 p-12 text-center dark:border-slate-700/70 dark:bg-slate-900/40">
            <Sparkles className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-2xl font-black tracking-tight">
              {t("empty.title", { year })}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {year === currentYear ? t("empty.current") : t("empty.past")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[stepIdx];

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-slate-950 text-white antialiased">
      {/* Per-step gradient backdrop. Sits behind everything; cross-fades
          as the user advances so the room itself feels like it's
          changing color, not just the foreground card. */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className={cn(
            "pointer-events-none absolute inset-0 z-0 bg-gradient-to-br",
            stepBackgrounds[currentStep],
          )}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* Poster mosaic overlay — only on intro + outro, where we want the
          "wrapped" feeling of seeing the whole year's artwork in one
          glance. Sits above the gradient so it adds texture without
          drowning the color story. */}
      <AnimatePresence>
        {(currentStep === "intro" || currentStep === "outro") &&
          stats.allPosters.length > 0 && (
            <motion.div
              key={`mosaic-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-[1]"
              aria-hidden="true"
            >
              <PosterMosaic posters={stats.allPosters} />
            </motion.div>
          )}
      </AnimatePresence>

      <StoryChrome
        year={year}
        availableYears={availableYears}
        onPickYear={setYear}
        showYearPicker={showYearPicker}
        setShowYearPicker={setShowYearPicker}
        onShare={handleOpenShare}
        onExit={exit}
        currentStep={stepIdx}
        totalSteps={totalSteps}
        tStory={t}
        showProgress
        isPlaying={isPlaying}
      />

      {/* Tap zones. Left third = back, rest = forward. Sit between the
          backdrop and the card content so taps anywhere on the body
          advance, but interactive elements (Share CTA, year chip, etc.)
          still intercept clicks via z-index. */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Previous"
        className="absolute inset-y-0 left-0 z-10 w-1/3"
      />
      <button
        type="button"
        onClick={goNext}
        aria-label="Next"
        className="absolute inset-y-0 right-0 z-10 w-2/3"
      />

      {/* Desktop chevron affordances. Always visible at low opacity so
          first-time users see that they can navigate without having to
          guess the keyboard shortcuts; brighten on hover. Hidden on
          mobile where the tap zones + swipe already do the job. */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Previous step"
        className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:text-white sm:flex disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/10"
        disabled={stepIdx === 0}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next step"
        className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:text-white sm:flex disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/10"
        disabled={stepIdx === STEPS.length - 1}
      >
        <ChevronRight size={18} />
      </button>

      <main
        className="relative z-20 flex flex-1 items-center justify-center px-6 pb-16 pt-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            // pointer-events-none on the wrapper, pointer-events-auto on
            // the actual card — lets the tap zones behind work everywhere
            // EXCEPT over interactive bits we explicitly opt back in.
            className="pointer-events-none w-full max-w-3xl text-center"
          >
            {currentStep === "intro" && (
              <IntroCard
                name={displayName}
                year={year}
                onAdvance={goNext}
                tStory={t}
              />
            )}
            {currentStep === "total" && (
              <TotalCard stats={stats} tStory={t} />
            )}
            {currentStep === "format" && (
              <FormatCard stats={stats} tStory={t} />
            )}
            {currentStep === "genres" && (
              <GenresCard stats={stats} tStory={t} />
            )}
            {currentStep === "creator" && (
              <CreatorCard stats={stats} tStory={t} />
            )}
            {currentStep === "standout" && (
              <StandoutCard
                stats={stats}
                monthLabels={monthLabels}
                tStory={t}
              />
            )}
            {currentStep === "picks" && (
              <PicksCard stats={stats} tStory={t} />
            )}
            {currentStep === "outro" && (
              <OutroCard
                stats={stats}
                onShare={handleOpenShare}
                onRestart={restart}
                onNewQuiz={() => router.push("/quiz")}
                tStory={t}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>


      {/* Share dialog */}
      <Dialog
        open={showShare}
        onClose={() => setShowShare(false)}
        ariaLabel={t("share.dialogTitle")}
        size="sm"
      >
        <div className="px-6 pb-8 pt-10 text-center sm:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("share.dialogTitle")}
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t("share.dialogSubtitle", { year })}
          </p>
          <div className="mx-auto mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {shareUrl ? (
              <QRCodeSVG
                value={shareUrl}
                size={208}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
                marginSize={0}
                aria-label={t("share.dialogTitle")}
              />
            ) : (
              <div className="flex h-[208px] w-[208px] items-center justify-center text-slate-400">
                {shareTokenLoading ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <QrCode size={64} strokeWidth={1.2} />
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShareLink()}
                disabled={!shareUrl}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <Share2 size={12} />
                {t("share.shareButton")}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyShareLink}
              disabled={!shareUrl}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <Copy size={12} />
              {t("share.copyLink")}
            </button>
            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto dark:bg-white dark:text-slate-900"
            >
              {t("share.close")}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default WrappedPage;
