"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ShieldOff, UserX } from "lucide-react";
import { toast } from "sonner";

import { useFeedStore } from "@/features/feed/store";

import { SectionCard, SectionHeader } from "./settings-ui";

/**
 * Settings → Feed "Blocked people" block. Lists every blocked handle (from
 * the in-memory feedStore.blocked set) with an unblock button. Hidden when
 * there's nothing to show so the section doesn't take up space until
 * there's a reason. Mirrors the mobile Blocked people list.
 */
export const BlockedPeopleCard = () => {
  const t = useTranslations("Settings.feed.blocked");
  const blocked = useFeedStore((s) => s.blocked);
  const unblock = useFeedStore((s) => s.unblock);

  const handles = useMemo(() => Array.from(blocked).sort(), [blocked]);

  return (
    <SectionCard>
      <SectionHeader title={t("title")} description={t("description")} />
      {handles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 py-10 text-center dark:border-slate-700/70 dark:bg-slate-900/30">
          <ShieldOff
            size={28}
            className="text-slate-300 dark:text-slate-600"
            aria-hidden
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {handles.map((handle) => (
            <li
              key={handle}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2 text-sm">
                <UserX
                  size={14}
                  className="text-rose-500 dark:text-rose-400"
                  aria-hidden
                />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  @{handle}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  unblock(handle);
                  toast.message(t("unblockedToast", { handle }));
                }}
                className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:bg-emerald-400/15 dark:text-emerald-300"
              >
                {t("unblock")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
};
