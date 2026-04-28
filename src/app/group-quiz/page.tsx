"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import type { QuizContentType } from "@/features/group-quiz/types/group-quiz";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";

const CONTENT_TYPES: { id: QuizContentType; label: string }[] = [
  { id: "both", label: "Both" },
  { id: "movie", label: "Movies" },
  { id: "book", label: "Books" },
];

const HOST_INTENT_KEY = "smart-advisor.group-quiz.host-intent";

interface HostIntent {
  display_name: string;
  content_type: QuizContentType;
  question_count: number;
}

const GroupQuizLandingPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [hostName, setHostName] = useState("");
  const [hostContentType, setHostContentType] = useState<QuizContentType>("both");
  const [questionCount, setQuestionCount] = useState(5);
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
      setHostContentType(parsed.content_type ?? "both");
      setQuestionCount(parsed.question_count ?? 5);
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
      };
      window.localStorage.setItem(HOST_INTENT_KEY, JSON.stringify(intent));
    }
    router.push("/auth?next=/group-quiz");
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error("Sign in to host a group quiz.");
      return;
    }
    const name = hostName.trim() || user.username || user.name?.split(/\s+/)[0] || "Host";
    setCreating(true);
    const { session, error } = await groupQuizService.createSession({
      content_type: hostContentType,
      question_count: questionCount,
      display_name: name,
    });
    setCreating(false);
    if (error || !session) {
      toast.error(error ?? "Failed to create session");
      return;
    }
    clearIntent();
    router.push(`/group-quiz/${session.code}`);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error("Enter a 6-character code.");
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
      toast.error(error ?? "Couldn't join session");
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
              Group Quiz
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              Find a Pick Together
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Host a quiz and share the code. Everyone answers, the AI finds
              one pick that fits the group.
            </p>
          </div>

          {pendingIntent && user && (
            <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                  Welcome Back
                </p>
                <p className="mt-1 text-sm font-bold tracking-tight">
                  Pick up where you left off?
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {pendingIntent.question_count} questions ·{" "}
                  {pendingIntent.content_type === "both"
                    ? "movies + books"
                    : pendingIntent.content_type === "movie"
                      ? "movies"
                      : "books"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {creating ? "Creating…" : "Continue"}
                  <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={clearIntent}
                  aria-label="Dismiss"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Host */}
            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Sparkles size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                    Host
                  </p>
                  <h2 className="text-lg font-black tracking-tight">
                    Start a New Session
                  </h2>
                </div>
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Your Name
                </span>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={user?.username || "How others see you"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>

              <div className="mb-3">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Pick Type
                </span>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setHostContentType(t.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.98]",
                        hostContentType === t.id
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Questions
                </span>
                <div
                  role="radiogroup"
                  aria-label="Number of questions"
                  className="grid grid-cols-5 gap-1.5 sm:grid-cols-7"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 3).map((n) => {
                    const active = questionCount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setQuestionCount(n)}
                        className={cn(
                          "rounded-xl border py-2 text-sm font-black tracking-tight transition-all duration-200 active:scale-[0.96]",
                          active
                            ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                            : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60",
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {creating ? "Creating…" : "Create Session"}
                  <ArrowRight size={14} />
                </button>
              ) : (
                <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
                  <p className="text-sm font-black tracking-tight">
                    Sign In to Host
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Hosting saves the group's pick to your library, tracks
                    streaks, and unlocks Year in Review.
                  </p>
                  <button
                    type="button"
                    onClick={handleSignInToHost}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-sm shadow-indigo-500/30 transition-colors hover:bg-indigo-600"
                  >
                    Sign In or Create Account
                    <ArrowRight size={14} />
                  </button>
                  <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                    Just want to play? Use the code on the right.
                  </p>
                </div>
              )}
            </section>

            {/* Join */}
            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Users size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Join
                  </p>
                  <h2 className="text-lg font-black tracking-tight">
                    Have a Code?
                  </h2>
                </div>
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Session Code
                </span>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black uppercase tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>

              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Your Name
                </span>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder={user?.username || "Display name"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>

              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-black tracking-tight text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
              >
                {joining ? "Joining…" : "Join Session"}
                <ArrowRight size={14} />
              </button>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                No account needed to join — just a name and a code.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupQuizLandingPage;
