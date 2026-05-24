"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";

/** In-app "What's new" — abridged per-batch notes for the web app.
 *  Linked from Settings → Help → What's new. Web doesn't ship versioned
 *  prereleases the way the mobile app does (no APK builds, no version
 *  codes), so entries here are date-stamped feature batches rather
 *  than `test.N` builds. */
interface Release {
  label: string;
  date: string;
  headline: string;
  bullets: string[];
}

const RELEASES: Release[] = [
  {
    label: "May 24, 2026",
    date: "May 24, 2026",
    headline: "@mention links and emoji reactions across feed + threads.",
    bullets: [
      "@username spans in post bodies + comments — tap to open that profile.",
      "Emoji reactions (❤️ 🔥 😂 😢 🤔 👏) on every post + every comment.",
      "Reaction picker is a single trailing + button so the strip stays compact.",
    ],
  },
  {
    label: "May 23, 2026",
    date: "May 23, 2026",
    headline:
      "Notifications bell, per-kind activity toggles, admin reports moderation.",
    bullets: [
      "Server notifications: followers, friend posts, comments, replies, post + comment upvotes.",
      "Per-kind activity toggles under Settings → Notifications (mute follows, mute friend-posts, etc).",
      "Admin Reports page (gated on profiles.is_admin) with open / reviewed / dismissed status chips.",
      "Public report status visible to the original reporter on Settings → Filed reports.",
      "Block flow gained a confirm dialog; blocked-people list scales with search above six entries.",
    ],
  },
  {
    label: "May 22, 2026",
    date: "May 22, 2026",
    headline:
      "Server-backed feed parity with mobile + profiles_public view.",
    bullets: [
      "Feed now reads from profiles_public so author display names hydrate across accounts.",
      "Dedicated report screen replaces the old window.prompt confirm.",
      "Reports moderation status (open / reviewed / dismissed) added to the schema.",
      "Followee-delete cascade so a deleted account doesn't leave dangling follows.",
    ],
  },
  {
    label: "May 21, 2026",
    date: "May 21, 2026",
    headline:
      "Feed sort (trending / new / top), clickable tags, eight new locales.",
    bullets: [
      "Trending / New / Top sort axis on top of the scope filter.",
      "Clickable r/community tags drill the feed into a single content lane.",
      "Edit-from-thread: open the composer directly from the post detail menu.",
      "UI translated into French, German, Portuguese, Italian, Dutch, Japanese, Chinese, and Korean.",
      "FAQ gained a Feed category with six questions covering the new UX.",
    ],
  },
  {
    label: "May 20, 2026",
    date: "May 20, 2026",
    headline:
      "Composer polish: live preview, cover-art lookup, focus retention.",
    bullets: [
      "Live preview in the composer before posting or editing.",
      "Cover lookup overwrites year and autofills director / creator metadata.",
      "Composer input keeps focus through the autocomplete loop.",
      "Confirm before discarding an unsaved pick.",
      "Post votes, comment edit, delete, share, and reporting all wired.",
    ],
  },
];

export default function ChangelogPage() {
  const router = useRouter();
  // First entry expanded by default — most recent build is visible
  // without a tap (same convention as the mobile in-app changelog).
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:bg-white sm:text-sm dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Updates
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
              What's new
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Recent feature drops, newest first. Tap a date to expand
              the highlights.
            </p>
          </div>

          <div className="space-y-4">
            {RELEASES.map((r, i) => {
              const isOpen = openIdx === i;
              return (
                <motion.div
                  key={r.date}
                  layout
                  className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        {r.label}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                        {r.headline}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "mt-1 shrink-0 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-indigo-500",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.16 }}
                      className="space-y-2 px-5 pb-5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300"
                    >
                      {r.bullets.map((b, j) => (
                        <li key={j} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
