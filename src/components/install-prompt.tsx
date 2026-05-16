"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Share, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sa:install-dismissed";
// Re-surface the prompt at most once a month after a dismissal.
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari exposes this non-standard flag instead of display-mode.
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/** True only for iOS Safari, the one iOS browser that can "Add to Home
 *  Screen". iPadOS 13+ reports as desktop Safari, so we also check touch. */
const isIosSafari = () => {
  const ua = window.navigator.userAgent;
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);
  return iOS && safari;
};

const recentlyDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

/**
 * Install affordance. Android/desktop Chrome fire `beforeinstallprompt`, so
 * we offer a real one-tap install button. iOS Safari has no such API — the
 * user must manually use the share sheet — so we show concise instructions
 * instead. Hidden once installed or recently dismissed.
 */
export function InstallPrompt() {
  const t = useTranslations("InstallPrompt");
  const [mode, setMode] = useState<"none" | "ios" | "prompt">("none");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const reveal = (next: "ios" | "prompt") => {
      setMode(next);
      // Small delay so the banner doesn't fight first paint.
      showTimer = setTimeout(() => setVisible(true), 2500);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      reveal("prompt");
    };
    const onInstalled = () => {
      setVisible(false);
      setMode("none");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) reveal("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode / storage disabled — fine, we just re-ask next visit.
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }, [deferred]);

  return (
    <AnimatePresence>
      {visible && mode !== "none" && (
        <motion.div
          role="dialog"
          aria-label={t("title")}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <div className="relative flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
              {mode === "ios" ? <Share size={18} /> : <Download size={18} />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                {t("title")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {mode === "ios" ? t("iosBody") : t("genericBody")}
              </p>

              {mode === "prompt" && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void install()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-black tracking-tight text-white shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <Download size={13} />
                    {t("install")}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    {t("dismiss")}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label={t("close")}
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
