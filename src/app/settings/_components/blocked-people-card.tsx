"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import {
  useBlockedProfiles,
  useUnblockUser,
} from "@/features/feed/use-feed";

import { SectionCard, SectionHeader } from "./settings-ui";

/** Once the list passes this threshold the card shows a live search
 *  field — for a handful of blocked profiles the search box adds
 *  more chrome than it saves. */
const SEARCH_THRESHOLD = 6;

/**
 * Settings → Feed "Blocked people" block. Lists every blocked profile
 * (from feed_blocks) with their avatar + an unblock button; a live
 * search field is lazily added once the list is long enough to be
 * worth filtering.
 */
export const BlockedPeopleCard = () => {
  const t = useTranslations("Settings.feed.blocked");
  const { data: blocked } = useBlockedProfiles();
  const unblockUser = useUnblockUser();
  const [query, setQuery] = useState("");

  const handles = useMemo(
    () => [...(blocked ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [blocked],
  );

  const q = query.trim().toLowerCase();
  const visible = q
    ? handles.filter((p) => p.name.toLowerCase().includes(q))
    : handles;
  const showSearch = handles.length >= SEARCH_THRESHOLD;

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
        <>
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase tracking-wide">
              {handles.length} blocked
            </span>
            {showSearch && q && (
              <span>
                {visible.length}{" "}
                {visible.length === 1 ? "match" : "matches"}
              </span>
            )}
          </div>
          {showSearch && (
            <div className="relative mb-3">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              />
            </div>
          )}
          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-600 dark:bg-rose-400/15 dark:text-rose-300">
                        {(profile.name[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      @{profile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      unblockUser.mutate(profile.id, {
                        onSuccess: () =>
                          toast.message(
                            t("unblockedToast", { handle: profile.name }),
                          ),
                      });
                    }}
                    className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:bg-emerald-400/15 dark:text-emerald-300"
                  >
                    {t("unblock")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </SectionCard>
  );
};
