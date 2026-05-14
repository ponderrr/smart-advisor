"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Users, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import type { QuizContentType } from "@/features/group-quiz/types/group-quiz";
import { AppNavbar } from "@/components/app-navbar";
import { SegmentedControl } from "@/components/ui/segmented-control";

const CONTENT_TYPE_IDS: QuizContentType[] = [
  "mix",
  "movie",
  "book",
  "music",
];

const HOST_INTENT_KEY = "smart-advisor.group-quiz.host-intent";

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
  const tQuestionCount = useTranslations("Quiz.questionCount");

  const [hostName, setHostName] = useState("");
  const [hostContentType, setHostContentType] = useState<QuizContentType>("mix");
  const [questionCount, setQuestionCount] = useState(5);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [creating, setCreating] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<HostIntent | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  // Restore a saved host intent after the user comes back from /auth.
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
    } catch {
      window.localStorage.removeItem(HOST_INTENT_KEY);
    }
  }, [user]);

  const clearIntent = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HOST_INTENT_KEY);
    }
    setPendingIntent(null);
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
    router.push("/auth?next=/group-quiz");
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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              {t("subtitle")}
            </p>
          </div>

          {pendingIntent && user && (
            <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
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
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {creating ? t("intent.continuing") : t("intent.continue")}
                  <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={clearIntent}
                  aria-label={t("intent.dismissAria")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Host */}
            <section className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm backdrop-blur-md dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-slate-900/40 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Sparkles size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                    {t("host.eyebrow")}
                  </p>
                  <h2 className="text-lg font-black tracking-tight">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
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
                    pillClassName: "bg-indigo-500",
                  }))}
                />
              </div>

              <div className="mb-4">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t("host.questionsLabel")}
                </span>
                <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/60 px-4 py-5 dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                  <div className="mb-4 text-center">
                    <motion.div
                      key={questionCount}
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent"
                    >
                      {questionCount}
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(parseInt(e.target.value, 10))
                    }
                    aria-label={t("host.questionsAria")}
                    className="w-full cursor-pointer accent-indigo-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span>3</span>
                    <span>15</span>
                  </div>
                  {(() => {
                    // Same 5-tier mapping as /question-count. Keyed on the
                    // tier name so the label only animates when the slider
                    // crosses a tier boundary, not on every tick.
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
                          <span className="inline-flex items-center rounded-full border border-indigo-200/70 bg-white/80 px-5 py-2 text-base font-black tracking-tight text-indigo-700 shadow-sm dark:border-indigo-500/40 dark:bg-slate-900/60 dark:text-indigo-300 sm:text-lg">
                            {tQuestionCount("estimate", {
                              minutes: estimateMin,
                            })}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mb-4">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t("host.maxPlayersLabel")}
                </span>
                <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/60 px-4 py-5 dark:border-slate-700/70 dark:from-rose-500/5 dark:via-slate-900/40 dark:to-amber-500/5">
                  <div className="mb-4 text-center">
                    <motion.div
                      key={maxParticipants}
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="bg-gradient-to-br from-rose-500 to-amber-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent"
                    >
                      {maxParticipants}
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={maxParticipants}
                    onChange={(e) =>
                      setMaxParticipants(parseInt(e.target.value, 10))
                    }
                    aria-label={t("host.maxPlayersAria")}
                    className="w-full cursor-pointer accent-rose-500"
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
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {creating ? t("host.creating") : t("host.create")}
                  <ArrowRight size={14} />
                </button>
              ) : (
                <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
                  <p className="text-sm font-black tracking-tight">
                    {t("host.signInTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {t("host.signInBody")}
                  </p>
                  <button
                    type="button"
                    onClick={handleSignInToHost}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-sm shadow-indigo-500/30 transition-colors hover:bg-indigo-600"
                  >
                    {t("host.signInCta")}
                    <ArrowRight size={14} />
                  </button>
                  <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                    {t("host.signInHint")}
                  </p>
                </div>
              )}
            </section>

            {/* Join */}
            <section className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm backdrop-blur-md dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900/40 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Users size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    {t("join.eyebrow")}
                  </p>
                  <h2 className="text-lg font-black tracking-tight">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black uppercase tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
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
                  placeholder={user?.username || t("join.namePlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>

              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-black tracking-tight text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
              >
                {joining ? t("join.joining") : t("join.join")}
                <ArrowRight size={14} />
              </button>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {t("join.footer")}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupQuizLandingPage;
