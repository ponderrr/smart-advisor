"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import type { QuizContentType } from "@/features/group-quiz/types/group-quiz";
import { AppNavbar } from "@/components/app-navbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { cn } from "@/lib/utils";

const CONTENT_TYPE_IDS: QuizContentType[] = [
  "mix",
  "movie",
  "book",
  "music",
];

const STEPS = ["path", "host", "join"] as const;
type Step = (typeof STEPS)[number];

/** Per-option pill color so the segmented-control's sliding pill carries
 *  the same accent that the rest of the host card will morph into. */
const PILL_BY_TYPE: Record<QuizContentType, string> = {
  mix: "bg-violet-500",
  both: "bg-violet-500",
  movie: "bg-amber-500",
  book: "bg-emerald-500",
  music: "bg-rose-500",
};

/** Shared class string for the gradient primary CTAs. Pair with a gradient
 *  (tone.barGradient for host, fixed emerald for join). Disabled state
 *  freezes hover lift/shadow so in-flight buttons don't shimmy. */
const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-sm disabled:hover:shadow-sm";

const HOST_INTENT_KEY = "smart-advisor.group-quiz.host-intent";

/** Total number of steps in the full group-quiz arc — landing accounts
 *  for path picker + host/join setup; in-session accounts for lobby,
 *  quiz, and result. */
const TOTAL_STEPS = 5;

interface HostIntent {
  display_name: string;
  content_type: QuizContentType;
  question_count: number;
  max_participants: number;
}

const GroupQuizLandingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("GroupQuiz.lobby");
  const tShell = useTranslations("GroupQuiz");
  const tPath = useTranslations("GroupQuiz.path");
  const tQuestionCount = useTranslations("Quiz.questionCount");

  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("path"),
  );

  const [hostName, setHostName] = useState("");
  const [hostContentType, setHostContentType] = useState<QuizContentType>("mix");
  const [questionCount, setQuestionCount] = useState(5);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [creating, setCreating] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<HostIntent | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  // 1 = forward to a deeper step, -1 = back toward the picker. Drives the
  // AnimatePresence slide direction between morphing step bodies.
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  // The accent that drives the shell chrome (eyebrow + progress bar). On
  // the host step it follows the host's live pick; everywhere else it
  // falls back to violet for a neutral feel.
  const shellContentType: QuizContentType | null =
    step === "host" ? hostContentType : null;
  const tone = getAccentTone(shellContentType);
  const pendingTone = getAccentTone(pendingIntent?.content_type ?? null);

  // Restore a saved host intent after the user comes back from /auth.
  // Auto-advances to the host step so they don't have to re-tap "Host".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    const raw = window.localStorage.getItem(HOST_INTENT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HostIntent;
      setHostName(parsed.display_name ?? "");
      setHostContentType(parsed.content_type ?? "mix");
      setQuestionCount(parsed.question_count ?? 5);
      setMaxParticipants(parsed.max_participants ?? 8);
      setPendingIntent(parsed);
      // Skip the picker step — the user already chose "Host" earlier.
      setSlideDirection(1);
      void setStep("host", { history: "replace" });
    } catch {
      window.localStorage.removeItem(HOST_INTENT_KEY);
    }
    // We only restore once on mount-with-user. The setStep dep is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const clearIntent = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HOST_INTENT_KEY);
    }
    setPendingIntent(null);
  };

  const goToStep = (next: Step, direction: 1 | -1) => {
    setSlideDirection(direction);
    void setStep(next);
  };

  const handlePickPath = (path: "host" | "join") => {
    goToStep(path, 1);
  };

  const handleBack = () => {
    if (step === "path") {
      // Group quiz is reachable while signed out (join needs no account),
      // so a guest's only "up" is the marketing home — /dashboard would
      // just bounce them to /auth.
      router.push(user ? "/dashboard" : "/");
      return;
    }
    goToStep("path", -1);
  };

  const handleSignInToHost = () => {
    if (typeof window !== "undefined") {
      const intent: HostIntent = {
        display_name: hostName.trim(),
        content_type: hostContentType,
        question_count: questionCount,
        max_participants: maxParticipants,
      };
      window.localStorage.setItem(HOST_INTENT_KEY, JSON.stringify(intent));
    }
    router.push("/auth?next=/group-quiz?step=host");
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error(t("errors.signInRequired"));
      return;
    }
    const name = hostName.trim() || user.username || user.name?.split(/\s+/)[0] || "Host";
    setCreating(true);
    const { session, error } = await groupQuizService.createSession({
      content_type: hostContentType,
      question_count: questionCount,
      max_participants: maxParticipants,
      display_name: name,
    });
    setCreating(false);
    if (error || !session) {
      toast.error(error ?? t("errors.createFailed"));
      return;
    }
    clearIntent();
    router.push(`/group-quiz/${session.code}`);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error(t("errors.codeLength"));
      return;
    }
    const name = joinName.trim() || "Guest";
    setJoining(true);
    const { session, error } = await groupQuizService.joinSession({
      code,
      display_name: name,
    });
    setJoining(false);
    if (error || !session) {
      toast.error(error ?? t("errors.joinFailed"));
      return;
    }
    router.push(`/group-quiz/${session.code}`);
  };

  // Resolve shell chrome (category / step label / progress / back label)
  // for the current step. These all read from the same `step` source of
  // truth so the chrome stays in lockstep with the body.
  let stepIndex = 1;
  let stepLabelKey: "path" | "host" | "join" = "path";
  if (step === "host") {
    stepIndex = 2;
    stepLabelKey = "host";
  } else if (step === "join") {
    stepIndex = 2;
    stepLabelKey = "join";
  }
  const progress = (stepIndex / TOTAL_STEPS) * 100;
  const backLabel =
    step === "path"
      ? user
        ? tShell("back.dashboard")
        : tShell("back.home")
      : tShell("back.step");

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <QuizStepShell
          category={tShell("category")}
          stepLabel={tShell("stepOf", {
            current: stepIndex,
            total: TOTAL_STEPS,
          })}
          progress={progress}
          onBack={handleBack}
          backLabel={backLabel}
          contentType={shellContentType}
        >
          {/* Inner card surface morphs as the step changes, mirroring the
              solo /quiz card pattern. Layout animation smooths height
              changes between the picker, host form, and join form. */}
          <motion.div
            layout
            transition={{
              layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            }}
            className={cn(
              "rounded-2xl border bg-gradient-to-br p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:p-6 md:p-8",
              tone.surfaceBorder,
              tone.surfaceGradient,
            )}
          >
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={slideDirection}
            >
              <motion.div
                key={step}
                custom={slideDirection}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: 30 * dir }),
                  center: {
                    opacity: 1,
                    x: 0,
                    transition: {
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  },
                  exit: {
                    opacity: 0,
                    transition: { duration: 0.15, ease: "easeIn" },
                  },
                }}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {step === "path" ? (
                  <PathPickerStep
                    onPick={handlePickPath}
                    pendingIntent={pendingIntent}
                    pendingTone={pendingTone}
                    creating={creating}
                    onContinueIntent={handleCreate}
                    onDismissIntent={clearIntent}
                    t={t}
                    tPath={tPath}
                  />
                ) : step === "host" ? (
                  <HostStep
                    hostName={hostName}
                    setHostName={setHostName}
                    hostContentType={hostContentType}
                    setHostContentType={setHostContentType}
                    questionCount={questionCount}
                    setQuestionCount={setQuestionCount}
                    maxParticipants={maxParticipants}
                    setMaxParticipants={setMaxParticipants}
                    user={user}
                    creating={creating}
                    onCreate={handleCreate}
                    onSignInToHost={handleSignInToHost}
                    t={t}
                    tQuestionCount={tQuestionCount}
                    tone={tone}
                  />
                ) : (
                  <JoinStep
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    joinName={joinName}
                    setJoinName={setJoinName}
                    joining={joining}
                    onJoin={handleJoin}
                    placeholder={user?.username ?? null}
                    t={t}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </QuizStepShell>
      </main>
    </div>
  );
};

/* -------------------- Path Picker Step -------------------- */

interface PathPickerStepProps {
  onPick: (path: "host" | "join") => void;
  pendingIntent: HostIntent | null;
  pendingTone: ReturnType<typeof getAccentTone>;
  creating: boolean;
  onContinueIntent: () => void;
  onDismissIntent: () => void;
  t: ReturnType<typeof useTranslations>;
  tPath: ReturnType<typeof useTranslations>;
}

const PathPickerStep = ({
  onPick,
  pendingIntent,
  pendingTone,
  creating,
  onContinueIntent,
  onDismissIntent,
  t,
  tPath,
}: PathPickerStepProps) => {
  return (
    <>
      <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
        {tPath("title")}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
        {tPath("subtitle")}
      </p>

      {pendingIntent && (
        <div
          className={cn(
            "mt-5 flex flex-col gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
            pendingTone.surfaceBorder,
            pendingTone.surfaceGradient,
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] font-black uppercase tracking-[0.16em]",
                pendingTone.text,
              )}
            >
              {t("intent.eyebrow")}
            </p>
            <p className="mt-1 text-sm font-bold tracking-tight">
              {t("intent.headline")}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {t("intent.summary", {
                count: pendingIntent.question_count,
                types: t(`intent.types.${pendingIntent.content_type}`),
                max: pendingIntent.max_participants,
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onContinueIntent}
              disabled={creating}
              className={cn(
                PRIMARY_CTA,
                "px-4 py-2 text-xs",
                pendingTone.barGradient,
              )}
            >
              {creating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : null}
              {creating ? t("intent.continuing") : t("intent.continue")}
              {!creating ? <ArrowRight size={12} /> : null}
            </button>
            <button
              type="button"
              onClick={onDismissIntent}
              aria-label={t("intent.dismissAria")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4">
        <PathCard
          accent="violet"
          icon={<Sparkles size={28} strokeWidth={1.5} />}
          eyebrow={tPath("cards.host.eyebrow")}
          title={tPath("cards.host.title")}
          description={tPath("cards.host.description")}
          onClick={() => onPick("host")}
        />
        <PathCard
          accent="emerald"
          icon={<Users size={28} strokeWidth={1.5} />}
          eyebrow={tPath("cards.join.eyebrow")}
          title={tPath("cards.join.title")}
          description={tPath("cards.join.description")}
          onClick={() => onPick("join")}
        />
      </div>
    </>
  );
};

/** Picker card visuals — borrowed from the solo content-selection-step's
 *  SelectionCard but stripped to the bits we need: icon block, eyebrow,
 *  title, description. Click auto-advances; no select-then-continue. */
const PATH_CARD_ACCENTS: Record<
  "violet" | "emerald",
  {
    border: string;
    fallbackBg: string;
    iconWrap: string;
    eyebrow: string;
  }
> = {
  violet: {
    border:
      "border-violet-200/60 hover:border-violet-400/70 dark:border-violet-500/30 dark:hover:border-violet-400/70",
    fallbackBg:
      "from-violet-50 via-white to-indigo-50 dark:from-violet-500/10 dark:via-slate-900/40 dark:to-indigo-500/10",
    iconWrap:
      "bg-violet-500 text-white shadow-lg shadow-violet-500/30",
    eyebrow: "text-violet-600 dark:text-violet-400",
  },
  emerald: {
    border:
      "border-emerald-200/60 hover:border-emerald-400/70 dark:border-emerald-500/30 dark:hover:border-emerald-400/70",
    fallbackBg:
      "from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    iconWrap:
      "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    eyebrow: "text-emerald-600 dark:text-emerald-400",
  },
};

const PathCard = ({
  accent,
  icon,
  eyebrow,
  title,
  description,
  onClick,
}: {
  accent: "violet" | "emerald";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  const a = PATH_CARD_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-left shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6",
        a.border,
        a.fallbackBg,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
            a.iconWrap,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.16em]",
              a.eyebrow,
            )}
          >
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight sm:text-lg">
            {title}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
            {description}
          </p>
        </div>
        <ArrowRight
          size={16}
          className="mt-1.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-slate-500"
        />
      </div>
    </button>
  );
};

/* -------------------- Host Setup Step -------------------- */

interface HostStepProps {
  hostName: string;
  setHostName: (v: string) => void;
  hostContentType: QuizContentType;
  setHostContentType: (v: QuizContentType) => void;
  questionCount: number;
  setQuestionCount: (v: number) => void;
  maxParticipants: number;
  setMaxParticipants: (v: number) => void;
  user: ReturnType<typeof useAuth>["user"];
  creating: boolean;
  onCreate: () => void;
  onSignInToHost: () => void;
  t: ReturnType<typeof useTranslations>;
  tQuestionCount: ReturnType<typeof useTranslations>;
  tone: ReturnType<typeof getAccentTone>;
}

const HostStep = ({
  hostName,
  setHostName,
  hostContentType,
  setHostContentType,
  questionCount,
  setQuestionCount,
  maxParticipants,
  setMaxParticipants,
  user,
  creating,
  onCreate,
  onSignInToHost,
  t,
  tQuestionCount,
  tone,
}: HostStepProps) => {
  return (
    <>
      <div className="mb-5 flex items-center gap-2">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300",
            tone.iconCircle,
          )}
        >
          <Sparkles size={15} />
        </span>
        <div>
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.16em] transition-colors duration-300",
              tone.text,
            )}
          >
            {t("host.eyebrow")}
          </p>
          <h2 className="text-lg font-black tracking-tight sm:text-xl">
            {t("host.title")}
          </h2>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("host.nameLabel")}
        </span>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder={user?.username || t("host.namePlaceholder")}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/70",
            tone.focusRing,
          )}
        />
      </label>

      <div className="mb-3">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("host.typeLabel")}
        </span>
        <SegmentedControl<QuizContentType>
          layoutId="group-quiz-content-type"
          value={hostContentType}
          onChange={setHostContentType}
          size="sm"
          ariaLabel={t("host.typeLabel")}
          options={CONTENT_TYPE_IDS.map((id) => ({
            value: id,
            label: t(`contentTypes.${id}`),
            pillClassName: PILL_BY_TYPE[id],
          }))}
        />
      </div>

      <div className="mb-4">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("host.questionsLabel")}
        </span>
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-5 dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="mb-4 text-center">
            <motion.div
              key={questionCount}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tighter text-transparent",
                tone.barGradient,
              )}
            >
              {questionCount}
            </motion.div>
          </div>
          <input
            type="range"
            min={3}
            max={15}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
            aria-label={t("host.questionsAria")}
            className={cn("w-full cursor-pointer", tone.sliderAccent)}
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>3</span>
            <span>15</span>
          </div>
          {(() => {
            const tier =
              questionCount <= 4
                ? "quick"
                : questionCount <= 7
                  ? "focused"
                  : questionCount <= 10
                    ? "balanced"
                    : questionCount <= 13
                      ? "thorough"
                      : "comprehensive";
            const estimateMin = Math.max(
              1,
              Math.ceil((questionCount * 18 + 30) / 60),
            );
            return (
              <>
                <motion.p
                  key={tier}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mt-3 text-center text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200"
                >
                  {tQuestionCount(`tone.${tier}`)}
                </motion.p>
                <div className="mt-3 flex justify-center">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border bg-white/80 px-5 py-2 text-base font-black tracking-tight shadow-sm transition-colors duration-300 dark:bg-slate-900/60 sm:text-lg",
                      tone.surfaceBorder,
                      tone.text,
                    )}
                  >
                    {tQuestionCount("estimate", { minutes: estimateMin })}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="mb-5">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("host.maxPlayersLabel")}
        </span>
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-5 dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="mb-4 text-center">
            <motion.div
              key={maxParticipants}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tighter text-transparent",
                tone.barGradient,
              )}
            >
              {maxParticipants}
            </motion.div>
          </div>
          <input
            type="range"
            min={2}
            max={12}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
            aria-label={t("host.maxPlayersAria")}
            className={cn("w-full cursor-pointer", tone.sliderAccent)}
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>2</span>
            <span>12</span>
          </div>
        </div>
      </div>

      {user ? (
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className={cn(PRIMARY_CTA, "w-full px-5 py-3 text-sm", tone.barGradient)}
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : null}
          {creating ? t("host.creating") : t("host.create")}
          {!creating ? <ArrowRight size={14} /> : null}
        </button>
      ) : (
        <div
          className={cn(
            "rounded-2xl border bg-gradient-to-br p-4 transition-colors duration-300",
            tone.surfaceBorder,
            tone.surfaceGradient,
          )}
        >
          <p className="text-sm font-black tracking-tight">
            {t("host.signInTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {t("host.signInBody")}
          </p>
          <button
            type="button"
            onClick={onSignInToHost}
            className={cn(
              PRIMARY_CTA,
              "mt-3 w-full px-5 py-2.5 text-sm",
              tone.barGradient,
            )}
          >
            {t("host.signInCta")}
            <ArrowRight size={14} />
          </button>
          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
            {t("host.signInHint")}
          </p>
        </div>
      )}
    </>
  );
};

/* -------------------- Join Step -------------------- */

interface JoinStepProps {
  joinCode: string;
  setJoinCode: (v: string) => void;
  joinName: string;
  setJoinName: (v: string) => void;
  joining: boolean;
  onJoin: () => void;
  placeholder: string | null;
  t: ReturnType<typeof useTranslations>;
}

const JoinStep = ({
  joinCode,
  setJoinCode,
  joinName,
  setJoinName,
  joining,
  onJoin,
  placeholder,
  t,
}: JoinStepProps) => {
  return (
    <>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Users size={15} />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            {t("join.eyebrow")}
          </p>
          <h2 className="text-lg font-black tracking-tight sm:text-xl">
            {t("join.title")}
          </h2>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("join.codeLabel")}
        </span>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder={t("join.codePlaceholder")}
          maxLength={6}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black uppercase tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/70"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {t("join.nameLabel")}
        </span>
        <input
          type="text"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          placeholder={placeholder ?? t("join.namePlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") onJoin();
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/70"
        />
      </label>

      <button
        type="button"
        onClick={onJoin}
        disabled={joining}
        className={cn(
          PRIMARY_CTA,
          "w-full from-emerald-500 to-teal-500 px-5 py-3 text-sm",
        )}
      >
        {joining ? <Loader2 size={14} className="animate-spin" /> : null}
        {joining ? t("join.joining") : t("join.join")}
        {!joining ? <ArrowRight size={14} /> : null}
      </button>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        {t("join.footer")}
      </p>
    </>
  );
};

export default GroupQuizLandingPage;
