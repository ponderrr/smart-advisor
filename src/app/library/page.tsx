"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  BookCheck,
  BookOpen,
  Bookmark,
  Film,
  LayoutGrid,
  Loader,
  Pencil,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { libraryService } from "@/features/library/services/library-service";
import {
  RATING_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type LibraryItem,
  type LibraryRating,
  type LibraryStatus,
} from "@/features/library/types/library";
import {
  SidebarNavGroup,
  SidebarNavItem,
  SidebarNavShell,
  SidebarUser,
} from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { PillButton } from "@/components/ui/pill-button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Dialog } from "@/components/ui/dialog";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { cn } from "@/lib/utils";

const MEDIUM_TABS = ["all", "movie", "book"] as const;
const VIEW_MODES = ["grid", "list"] as const;
type MediumFilter = (typeof MEDIUM_TABS)[number];
type StatusFilter = "all" | LibraryStatus;

const STATUS_VALUES: LibraryStatus[] = ["finished", "in_progress", "wishlist"];
const RATING_VALUES: LibraryRating[] = [1, 2, 3];


const ratingChip = (rating: LibraryRating | null) => {
  if (rating === null) return null;
  const Icon = rating === 1 ? ThumbsDown : rating === 3 ? ThumbsUp : Bookmark;
  const tone =
    rating === 3
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : rating === 1
        ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone,
      )}
    >
      <Icon size={12} />
      {RATING_LABELS[rating]}
    </span>
  );
};

const statusChip = (status: LibraryStatus) => (
  <span
    className={cn(
      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
      STATUS_TONE[status].chip,
    )}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediumFilter, setMediumFilter] = useQueryState(
    "type",
    parseAsStringLiteral(MEDIUM_TABS).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODES).withDefault("list"),
  );
  const [editTarget, setEditTarget] = useState<LibraryItem | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await libraryService.list();
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setItems(data);
  };

  useEffect(() => {
    if (ready) void load();
  }, [ready]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (mediumFilter !== "all" && item.medium !== mediumFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, mediumFilter, statusFilter]);

  const handleRemove = async (item: LibraryItem) => {
    const ok = window.confirm(`Remove "${item.title}" from your library?`);
    if (!ok) return;
    const { error } = await libraryService.remove(item.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Removed from library");
    setItems((current) => current.filter((i) => i.id !== item.id));
  };

  const stats = useMemo(() => {
    const total = items.length;
    const finished = items.filter((i) => i.status === "finished").length;
    const movies = items.filter((i) => i.medium === "movie").length;
    const books = items.filter((i) => i.medium === "book").length;
    return { total, finished, movies, books };
  }, [items]);

  if (!ready) {
    return <PageLoader text="Loading..." />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                Library
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                What You&apos;ve Watched and Read
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Reactions you save here become a taste signal the AI uses on
                your next quiz.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HoverBorderGradient
                onClick={() => router.push("/content-selection")}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="99, 102, 241"
                darkHighlightColor="129, 140, 248"
                containerClassName="rounded-full w-fit"
                className="flex items-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                <Sparkles size={16} />
                Start Quiz
              </HoverBorderGradient>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell>
              <nav aria-label="Library filters" className="flex-1">
                <SidebarNavGroup label="Type" />
                {(
                  [
                    {
                      id: "all" as const,
                      label: "All",
                      icon: <LayoutGrid size={16} />,
                    },
                    {
                      id: "movie" as const,
                      label: "Movies",
                      icon: <Film size={16} />,
                    },
                    {
                      id: "book" as const,
                      label: "Books",
                      icon: <BookOpen size={16} />,
                    },
                  ] as { id: MediumFilter; label: string; icon: React.ReactNode }[]
                ).map((tab) => (
                  <SidebarNavItem
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    active={mediumFilter === tab.id}
                    onClick={() => setMediumFilter(tab.id)}
                  />
                ))}
              </nav>

              <div className="mt-6">
                <SidebarUser
                  name={user?.name ?? ""}
                  email={user?.email ?? ""}
                  avatarUrl={user?.avatar_url}
                />
              </div>
            </SidebarNavShell>

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Total", value: stats.total },
                    { label: "Finished", value: stats.finished },
                    { label: "Movies", value: stats.movies },
                    { label: "Books", value: stats.books },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-lg font-black tracking-tight">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </span>
                    {(
                      [
                        { id: "all", label: "All" },
                        ...STATUS_VALUES.map((s) => ({
                          id: s as StatusFilter,
                          label: STATUS_LABELS[s],
                        })),
                      ] as { id: StatusFilter; label: string }[]
                    ).map((opt) => (
                      <PillButton
                        key={opt.id}
                        active={statusFilter === opt.id}
                        onClick={() => setStatusFilter(opt.id)}
                        className="px-3 py-1.5 text-xs font-semibold"
                      >
                        {opt.label}
                      </PillButton>
                    ))}
                  </div>
                  <ViewToggle
                    value={view as ViewMode}
                    onChange={(v) => setView(v)}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!loading && (
                <motion.div
                  key={`${mediumFilter}-${statusFilter}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.2 }}
                >
                  {filtered.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
                      <BookCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <h2 className="mt-4 text-2xl font-black tracking-tight">
                        {items.length === 0
                          ? "Nothing in Your Library Yet"
                          : "No Matches for Those Filters"}
                      </h2>
                      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                        {items.length === 0
                          ? 'After your next quiz, hit "I watched / read this" on a result and it will show up here.'
                          : "Try changing or clearing the filters above."}
                      </p>
                    </div>
                  ) : view === "grid" ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                      {filtered.map((item) => (
                        <article
                          key={item.id}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                            {item.poster_url ? (
                              <Image
                                src={item.poster_url}
                                alt={item.title}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                {item.medium === "movie" ? (
                                  <Film size={28} />
                                ) : (
                                  <BookOpen size={28} />
                                )}
                              </div>
                            )}
                            <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                              <PillButton
                                onClick={() => setEditTarget(item)}
                                aria-label={`Edit ${item.title}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 p-0 text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200"
                              >
                                <Pencil size={13} />
                              </PillButton>
                              <PillButton
                                onClick={() => void handleRemove(item)}
                                variant="destructive"
                                aria-label={`Remove ${item.title}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0 shadow-sm"
                              >
                                <Trash2 size={13} />
                              </PillButton>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3">
                              <p className="line-clamp-2 text-sm font-black leading-tight tracking-tight text-white">
                                {item.title}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                    STATUS_TONE[item.status].chip,
                                  )}
                                >
                                  {STATUS_LABELS[item.status]}
                                </span>
                                {item.rating !== null &&
                                  (() => {
                                    const Icon =
                                      item.rating === 1
                                        ? ThumbsDown
                                        : item.rating === 3
                                          ? ThumbsUp
                                          : Bookmark;
                                    return (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-sm">
                                        <Icon size={9} />
                                        {RATING_LABELS[item.rating]}
                                      </span>
                                    );
                                  })()}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((item) => (
                        <article
                          key={item.id}
                          className="group flex gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                            {item.poster_url ? (
                              <Image
                                src={item.poster_url}
                                alt={item.title}
                                fill
                                sizes="96px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                {item.medium === "movie" ? (
                                  <Film size={24} />
                                ) : (
                                  <BookOpen size={24} />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-base font-black tracking-tight">
                                  {item.title}
                                </h3>
                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {item.creator
                                    ? `${item.medium === "book" ? "By " : "Directed by "}${item.creator}`
                                    : item.medium === "movie"
                                      ? "Movie"
                                      : "Book"}
                                  {item.year ? ` · ${item.year}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <PillButton
                                  onClick={() => setEditTarget(item)}
                                  aria-label={`Edit ${item.title}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                                >
                                  <Pencil size={13} />
                                </PillButton>
                                <PillButton
                                  onClick={() => void handleRemove(item)}
                                  variant="destructive"
                                  aria-label={`Remove ${item.title}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                                >
                                  <Trash2 size={13} />
                                </PillButton>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {statusChip(item.status)}
                              {ratingChip(item.rating)}
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                Logged {format(new Date(item.logged_at), "PP")}
                              </span>
                            </div>

                            {item.reaction && (
                              <p className="mt-2 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-300">
                                &ldquo;{item.reaction}&rdquo;
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <EditDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setItems((current) =>
            current.map((i) => (i.id === updated.id ? updated : i)),
          );
        }}
      />
    </div>
  );
}

interface EditDialogProps {
  target: LibraryItem | null;
  onClose: () => void;
  onSaved: (item: LibraryItem) => void;
}

const EditDialog = ({ target, onClose, onSaved }: EditDialogProps) => {
  const [status, setStatus] = useState<LibraryStatus>("finished");
  const [rating, setRating] = useState<LibraryRating | null>(null);
  const [reaction, setReaction] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setStatus(target.status);
      setRating(target.rating);
      setReaction(target.reaction ?? "");
    }
  }, [target]);

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    const { error } = await libraryService.update(target.id, {
      status,
      rating,
      reaction,
    });
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Library entry updated");
    onSaved({
      ...target,
      status,
      rating,
      reaction: reaction.trim() || null,
    });
    onClose();
  };

  return (
    <Dialog
      open={!!target}
      onClose={onClose}
      ariaLabel="Edit library entry"
      size="sm"
      disableClose={saving}
    >
      {target && (
        <div className="flex flex-col items-center p-6 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-4 dark:from-emerald-900/30 dark:to-teal-900/30"
              >
                <BookCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </motion.div>

              <div className="w-full max-w-md">
                <h2 className="text-2xl font-black tracking-tight">
                  Edit entry
                </h2>
                <p
                  className="mt-2 truncate text-sm font-semibold text-slate-700 dark:text-slate-300"
                  title={target.title}
                >
                  {target.title}
                </p>

                <div className="mt-6 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_VALUES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          status === s
                            ? STATUS_TONE[s].active
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
                        )}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rating
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RATING_VALUES.map((r) => {
                      const active = rating === r;
                      const Icon =
                        r === 1 ? ThumbsDown : r === 2 ? Bookmark : ThumbsUp;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRating(active ? null : r)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                            active
                              ? r === 3
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : r === 1
                                  ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300"
                                  : "border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400",
                          )}
                        >
                          <Icon size={14} />
                          {RATING_LABELS[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 text-left">
                  <label
                    htmlFor="library-edit-reaction"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Reaction
                  </label>
                  <textarea
                    id="library-edit-reaction"
                    value={reaction}
                    onChange={(e) => setReaction(e.target.value.slice(0, 280))}
                    rows={3}
                    maxLength={280}
                    placeholder="One-line takeaway…"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  <p className="mt-1 text-right text-[10px] font-semibold text-slate-400">
                    {reaction.length}/280
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                  className="mt-6 w-full"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </Button>

                <button
                  onClick={onClose}
                  disabled={saving}
                  className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
        </div>
      )}
    </Dialog>
  );
};
