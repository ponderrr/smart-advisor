"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BookCheck,
  Clock,
  Newspaper,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

// Routes where the bottom nav is intentionally hidden. Marketing surfaces,
// the auth/onboarding funnel, and anything inside the active quiz flow —
// the FAB pointing back to "start a quiz" would be confusing while the user
// is already in one.
const HIDDEN_PREFIXES = [
  "/auth",
  "/onboarding",
  "/demo",
  "/maintenance",
  "/quiz",
  "/results",
];

// Exact-match version of the same idea — pages that shouldn't show the nav
// but whose prefix could overlap something we DO want to show. (Home/`/` is
// allowed: signed-in visitors that land back on marketing still get a way
// to jump straight to Dashboard / Library / etc. from the bottom nav.)
const HIDDEN_EXACT = new Set<string>();

const isInsideGroupQuizRoom = (pathname: string) =>
  pathname.startsWith("/group-quiz/") && pathname !== "/group-quiz/";

const shouldHide = (pathname: string) => {
  if (HIDDEN_EXACT.has(pathname)) return true;
  if (isInsideGroupQuizRoom(pathname)) return true;
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

interface TileProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const Tile = ({ label, icon, active, onClick }: TileProps) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    whileTap={{ scale: 0.94 }}
    transition={{ type: "spring", stiffness: 520, damping: 22 }}
    className={cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-bold tracking-tight transition-colors",
      active
        ? "text-indigo-600 dark:text-indigo-300"
        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
    )}
  >
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
        active && "bg-indigo-500/10 dark:bg-indigo-400/15",
      )}
    >
      {icon}
    </span>
    {label}
  </motion.button>
);

export const MobileBottomNav = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { user, session } = useAuth();
  const t = useTranslations("MobileNav");
  const [quizMenuOpen, setQuizMenuOpen] = useState(false);

  const visible = !!user && !!session && !shouldHide(pathname);

  // Close the mini-menu on route change so it never lingers after a tile tap.
  useEffect(() => {
    setQuizMenuOpen(false);
  }, [pathname]);

  // Tag the body when the nav is on screen so the layout can carve out
  // safe space below content (via a globals.css rule scoped to mobile).
  useEffect(() => {
    if (visible) {
      document.body.setAttribute("data-mobile-nav", "visible");
    } else {
      document.body.removeAttribute("data-mobile-nav");
    }
    return () => {
      document.body.removeAttribute("data-mobile-nav");
    };
  }, [visible]);

  if (!visible) return null;

  const matches = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  const go = (href: string) => () => router.push(href);

  return (
    <>
      <nav
        aria-label={t("ariaLabel")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] md:hidden dark:border-slate-700/60 dark:bg-slate-950/95"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          // Force a separate compositor layer so page-level paint events
          // (segmented-control pill animations, etc.) don't cause iOS Safari
          // to wobble the fixed-position nav.
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <div className="relative mx-auto flex max-w-md items-stretch px-2">
          <Tile
            href="/feed"
            label={t("feed")}
            icon={<Newspaper size={18} />}
            active={matches("/feed")}
            onClick={go("/feed")}
          />
          <Tile
            href="/library"
            label={t("library")}
            icon={<BookCheck size={18} />}
            active={matches("/library")}
            onClick={go("/library")}
          />

          {/* Centered raised FAB — sits in flow as a spacer so the flanking
              tiles stay symmetric, but the visible circle is absolutely
              positioned so it pokes above the bar. */}
          <div className="relative flex w-16 shrink-0 items-end justify-center">
            <motion.button
              type="button"
              onClick={() => setQuizMenuOpen(true)}
              aria-label={t("quiz")}
              aria-haspopup="dialog"
              aria-expanded={quizMenuOpen}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 480, damping: 20 }}
              className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 ring-4 ring-white dark:bg-white dark:text-slate-900 dark:shadow-white/20 dark:ring-slate-950"
            >
              <Sparkles size={22} />
            </motion.button>
          </div>

          <Tile
            href="/history"
            label={t("history")}
            icon={<Clock size={18} />}
            active={matches("/history")}
            onClick={go("/history")}
          />
          <Tile
            href="/settings"
            label={t("profile")}
            icon={<User size={18} />}
            active={matches("/settings") || matches("/account")}
            onClick={go("/settings")}
          />
        </div>
      </nav>

      <QuizMiniMenu
        open={quizMenuOpen}
        onClose={() => setQuizMenuOpen(false)}
        onPick={(href) => {
          setQuizMenuOpen(false);
          router.push(href);
        }}
      />
    </>
  );
};

interface QuizMiniMenuProps {
  open: boolean;
  onClose: () => void;
  onPick: (href: string) => void;
}

const QuizMiniMenu = ({ open, onClose, onPick }: QuizMiniMenuProps) => {
  const t = useTranslations("MobileNav.quizMenu");

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="quiz-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
          <motion.div
            key="quiz-menu-sheet"
            role="dialog"
            aria-label={t("ariaLabel")}
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200/70 bg-white p-5 shadow-2xl md:hidden dark:border-slate-700/60 dark:bg-slate-900"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("subtitle")}
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => onPick("/quiz")}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
                  <Sparkles size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {t("solo")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {t("soloDesc")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onPick("/group-quiz")}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-amber-500/10"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md">
                  <Users size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {t("group")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {t("groupDesc")}
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("close")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
