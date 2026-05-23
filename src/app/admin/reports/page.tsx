"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ExternalLink, Flag, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { useAllReports, useSetReportStatus } from "@/features/feed/use-feed";
import type {
  AdminReport,
  ReportStatus,
} from "@/features/feed/feed-service";
import { cn } from "@/lib/utils";

type Filter = "open" | "resolved" | "all";

/**
 * /admin/reports — staff-only moderation queue for user-filed reports
 * on posts and comments. Read visibility is gated server-side by the
 * `feed_reports_select_admin` RLS policy (profiles.is_admin = TRUE);
 * status changes are gated by `feed_reports_update_admin`. Non-admins
 * who hit this URL directly just see the empty state because the
 * query returns no rows for them.
 */
export default function AdminReportsPage() {
  const { data, isLoading, error } = useAllReports();
  const setStatus = useSetReportStatus();
  const [filter, setFilter] = useState<Filter>("open");

  const reports = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    let open = 0;
    let resolved = 0;
    for (const r of reports) {
      if (r.status === "open") open++;
      else resolved++;
    }
    return { open, resolved, all: reports.length };
  }, [reports]);

  const visible = useMemo(() => {
    return reports.filter((r) => {
      if (filter === "open") return r.status === "open";
      if (filter === "resolved") return r.status !== "open";
      return true;
    });
  }, [reports, filter]);

  const onSetStatus = (reportId: string, status: ReportStatus) => {
    setStatus.mutate(
      { reportId, status },
      {
        onSuccess: () =>
          toast.success(
            status === "reviewed"
              ? "Marked reviewed"
              : status === "dismissed"
                ? "Dismissed"
                : "Reopened",
          ),
        onError: () => toast.error("Couldn't update the report — try again."),
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Flag size={14} aria-hidden />
        Admin
      </div>
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
        Reports
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        User-filed reports on posts and comments. Mark each one reviewed
        once you&rsquo;ve taken action, or dismiss if no action is needed.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "open"}
          onClick={() => setFilter("open")}
          label={`Open · ${counts.open}`}
        />
        <FilterChip
          active={filter === "resolved"}
          onClick={() => setFilter("resolved")}
          label={`Resolved · ${counts.resolved}`}
        />
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`All · ${counts.all}`}
        />
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading reports…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Couldn&rsquo;t load reports.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 py-10 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/30 dark:text-slate-400">
            {filter === "open" ? "No open reports." : "No reports here."}
          </p>
        ) : (
          visible.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onSetStatus={onSetStatus}
              pending={setStatus.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-tight transition-colors",
        active
          ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300"
          : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      {label}
    </button>
  );
}

function ReportCard({
  report,
  onSetStatus,
  pending,
}: {
  report: AdminReport;
  onSetStatus: (id: string, status: ReportStatus) => void;
  pending: boolean;
}) {
  const navHref =
    report.target === "post"
      ? report.postId
        ? `/feed/${report.postId}`
        : null
      : report.commentPostId
        ? `/feed/${report.commentPostId}`
        : null;
  const resolved = report.status !== "open";
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 transition-opacity dark:border-slate-700 dark:bg-slate-900/60",
        resolved && "opacity-65",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
            report.target === "post"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-violet-500/15 text-violet-600 dark:text-violet-300",
          )}
        >
          {report.target}
        </span>
        <StatusBadge status={report.status} />
        <span className="ml-auto text-xs text-slate-400">
          {ago(report.createdAt)}
        </span>
      </div>

      <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-3">
        {report.targetLabel?.trim() || "(deleted)"}
      </p>
      {report.targetAuthorUsername || report.targetAuthorName ? (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          by @{report.targetAuthorUsername ?? report.targetAuthorName}
        </p>
      ) : null}

      <div className="mt-3 flex items-start gap-2 text-xs">
        <Flag
          size={13}
          className="mt-0.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <span className="flex-1 font-semibold text-slate-700 dark:text-slate-200">
          {report.reason?.trim() || "no reason"}
        </span>
        {(report.reporterUsername || report.reporterName) && (
          <span className="text-slate-400">
            — @{report.reporterUsername ?? report.reporterName}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {navHref && (
          <Link
            href={navHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ExternalLink size={12} />
            Open {report.target === "post" ? "post" : "thread"}
          </Link>
        )}
        {report.status === "open" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => onSetStatus(report.id, "reviewed")}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 disabled:opacity-60 dark:bg-emerald-400/15 dark:text-emerald-300"
            >
              <Check size={12} />
              Reviewed
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onSetStatus(report.id, "dismissed")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={12} />
              Dismiss
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onSetStatus(report.id, "open")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <RotateCcw size={12} />
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === "reviewed") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
        Reviewed
      </span>
    );
  }
  if (status === "dismissed") {
    return (
      <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:bg-slate-400/15 dark:text-slate-300">
        Dismissed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
      Open
    </span>
  );
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
