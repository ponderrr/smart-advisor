"use client";

import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";

import { useMyReports } from "@/features/feed/use-feed";
import type { ReportStatus } from "@/features/feed/feed-service";

import { SectionCard, SectionHeader } from "./settings-ui";

/** Pill describing where a report sits in the moderation queue —
 *  shared with the admin Reports surface so the same vocabulary is
 *  used on both sides. */
function ReportStatusBadge({
  status,
  reviewedLabel,
  dismissedLabel,
  reviewLabel,
}: {
  status: ReportStatus;
  reviewedLabel: string;
  dismissedLabel: string;
  reviewLabel: string;
}) {
  if (status === "reviewed") {
    return (
      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
        {reviewedLabel}
      </span>
    );
  }
  if (status === "dismissed") {
    return (
      <span className="shrink-0 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-400/15 dark:text-slate-300">
        {dismissedLabel}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
      {reviewLabel}
    </span>
  );
}

/**
 * Settings → Feed "Reports you've filed" block. Lists the reports the
 * current user submitted (feed_reports rows, readable via their own-row
 * SELECT policy). Reports are reviewed by staff — there's no action here
 * beyond seeing what's pending.
 */
export const MyReportsCard = () => {
  const t = useTranslations("Settings.feed.reports");
  const { data: reports } = useMyReports();
  const list = reports ?? [];

  return (
    <SectionCard>
      <SectionHeader title={t("title")} description={t("description")} />
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 py-10 text-center dark:border-slate-700/70 dark:bg-slate-900/30">
          <Flag
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
          {list.map((report) => (
            <li
              key={report.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <Flag size={12} aria-hidden />
                  {t(report.target === "post" ? "onPost" : "onComment")}
                  <span className="font-medium normal-case">
                    · {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {report.targetLabel ?? t("contentGone")}
                </p>
                {report.reason && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    &ldquo;{report.reason}&rdquo;
                  </p>
                )}
              </div>
              <ReportStatusBadge
                status={report.status}
                reviewLabel={t("statusReview")}
                reviewedLabel={t("statusReviewed")}
                dismissedLabel={t("statusDismissed")}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
};
