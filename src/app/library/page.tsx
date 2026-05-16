"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  BookCheck,
  BookOpen,
  Bookmark,
  ChevronDown,
  Film,
  LayoutGrid,
  Loader,
  Music,
  Pencil,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { libraryService } from "@/features/library/services/library-service";
import {
  STATUS_PILL_CLASSES,
  STATUS_TONE,
  type LibraryItem,
  type LibraryRating,
  type LibraryStatus,
} from "@/features/library/types/library";
import { getRecTypeAccent } from "@/features/recommendations/utils/type-accent";
import {
  SidebarNavGroup,
  SidebarNavItem,
  SidebarNavShell,
  SidebarUser,
} from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { PillButton } from "@/components/ui/pill-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { ViewToggle } from "@/components/view-toggle";
import { usePersistedViewMode } from "@/hooks/use-persisted-view-mode";
import { cn } from "@/lib/utils";

const MEDIUM_TABS = ["all", "movie", "book", "music"] as const;
type MediumFilter = (typeof MEDIUM_TABS)[number];
type StatusFilter = "all" | LibraryStatus;

const STATUS_VALUES: LibraryStatus[] = [
  "wishlist",
  "in_progress",
  "finished",
  "dropped",
];
const STATUS_FILTER_VALUES = ["all", ...STATUS_VALUES] as const;
const ALL_FILTER_PILL_CLASS = "bg-slate-700 dark:bg-slate-600";


export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const t = useTranslations("Library");
  const tc = useTranslations("Common");

  const ratingChip = (rating: LibraryRating | null) => {
    if (rating === null) return null;
    const Icon =
      rating === 1 ? ThumbsDown : rating === 3 ? ThumbsUp : Bookmark;
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
        {t(`rating.${rating}`)}
      </span>
    );
  };

  const StatusChipMenu = ({
    item,
    variant = "list",
  }: {
    item: LibraryItem;
    variant?: "list" | "grid";
  }) => {
    const isGrid = variant === "grid";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("statusChangeAria", { title: item.title })}
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
              isGrid
                ? "px-1.5 py-0.5 text-[9px]"
                : "px-2.5 py-1 text-[11px]",
              STATUS_TONE[item.status].chip,
            )}
          >
            {t(`status.${item.status}`)}
            <ChevronDown size={isGrid ? 9 : 11} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {STATUS_VALUES.map((s) => (
            <DropdownMenuItem
              key={s}
              disabled={s === item.status}
              onSelect={() => {
                void handleStatusChange(item, s);
              }}
              className="cursor-pointer text-xs font-semibold"
            >
              {t(`status.${s}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediumFilter, setMediumFilter] = useQueryState(
    "type",
    parseAsStringLiteral(MEDIUM_TABS).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_FILTER_VALUES).withDefault("all"),
  );
  const [view, setView] = usePersistedViewMode("list");
  const [editTarget, setEditTarget] = useState<LibraryItem | null>(null);

  // Snap to top instantly when the filters change so the user doesn't get
  // stuck mid-scroll in empty space after narrowing a long list. Mirrors
  // the same pattern in settings + dashboard.
  const filterInitialRenderRef = useRef(true);
  useEffect(() => {
    if (filterInitialRenderRef.current) {
      filterInitialRenderRef.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [mediumFilter, statusFilter]);

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

  const handleStatusChange = async (
    item: LibraryItem,
    nextStatus: LibraryStatus,
  ) => {
    if (nextStatus === item.status) return;

    const { error } = await libraryService.update(item.id, {
      status: nextStatus,
    });
    if (error) {
      toast.error(error);
      return;
    }

    const updated: LibraryItem = {
      ...item,
      status: nextStatus,
      finished_at:
        nextStatus === "finished" ? new Date().toISOString() : null,
    };
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? updated : entry)),
    );
    toast.success(t("updated"));

    // Marking something finished without a rating is the moment to capture the
    // signal — open the edit dialog so the user adds the thumb while it's fresh.
    if (nextStatus === "finished" && updated.rating === null) {
      setEditTarget(updated);
    }
  };

  const handleRemove = async (item: LibraryItem) => {
    const ok = window.confirm(t("removeConfirm", { title: item.title }));
    if (!ok) return;
    const { error } = await libraryService.remove(item.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(t("removed"));
    setItems((current) => current.filter((i) => i.id !== item.id));
  };

  const stats = useMemo(() => {
    const total = items.length;
    const finished = items.filter((i) => i.status === "finished").length;
    const movies = items.filter((i) => i.medium === "movie").length;
    const books = items.filter((i) => i.medium === "book").length;
    const music = items.filter((i) => i.medium === "music").length;
    return { total, finished, movies, books, music };
  }, [items]);

  if (!ready) {
    return <PageLoader text={tc("loading")} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                {t("eyebrow")}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HoverBorderGradient
                onClick={() => router.push("/quiz")}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="99, 102, 241"
                darkHighlightColor="129, 140, 248"
                containerClassName="rounded-full w-fit"
                className="flex items-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                <Sparkles size={16} />
                {t("startQuiz")}
              </HoverBorderGradient>
            </div>
          </div>

          {/* Mobile pill nav — mirrors the dashboard pattern; the sidebar
              below stays for md+ where vertical room is plentiful. */}
          <div className="mb-4 md:hidden">
            <SegmentedControl<MediumFilter>
              layoutId="library-medium-tabs"
              value={mediumFilter}
              onChange={setMediumFilter}
              size="sm"
              ariaLabel={t("filtersAria")}
              options={[
                {
                  value: "all",
                  label: t("type.all"),
                  icon: <LayoutGrid size={13} />,
                  pillClassName: "bg-indigo-500",
                },
                {
                  value: "movie",
                  label: t("type.movie"),
                  icon: <Film size={13} />,
                  pillClassName: "bg-amber-500",
                },
                {
                  value: "book",
                  label: t("type.book"),
                  icon: <BookOpen size={13} />,
                  pillClassName: "bg-emerald-500",
                },
                {
                  value: "music",
                  label: t("type.music"),
                  icon: <Music size={13} />,
                  pillClassName: "bg-rose-500",
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell className="hidden md:flex">
              <nav aria-label={t("filtersAria")} className="flex-1">
                <SidebarNavGroup label={t("typeGroup")} />
                {(
                  [
                    {
                      id: "all" as const,
                      label: t("type.all"),
                      icon: <LayoutGrid size={16} />,
                    },
                    {
                      id: "movie" as const,
                      label: t("type.movie"),
                      icon: <Film size={16} />,
                      iconClassName: "text-amber-500 dark:text-amber-400",
                    },
                    {
                      id: "book" as const,
                      label: t("type.book"),
                      icon: <BookOpen size={16} />,
                      iconClassName: "text-emerald-500 dark:text-emerald-400",
                    },
                    {
                      id: "music" as const,
                      label: t("type.music"),
                      icon: <Music size={16} />,
                      iconClassName: "text-rose-500 dark:text-rose-400",
                    },
                  ] as {
                    id: MediumFilter;
                    label: string;
                    icon: React.ReactNode;
                    iconClassName?: string;
                  }[]
                ).map((tab) => (
                  <SidebarNavItem
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    active={mediumFilter === tab.id}
                    iconClassName={tab.iconClassName}
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

            <div className="min-w-0 flex-1 overflow-x-clip">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { label: t("stats.total"), value: stats.total, accent: null },
                      {
                        label: t("stats.finished"),
                        value: stats.finished,
                        accent: null,
                      },
                      {
                        label: t("stats.movies"),
                        value: stats.movies,
                        accent: "movie" as const,
                      },
                      {
                        label: t("stats.books"),
                        value: stats.books,
                        accent: "book" as const,
                      },
                      {
                        label: t("stats.music"),
                        value: stats.music,
                        accent: "music" as const,
                      },
                    ]
                  ).map((item) => {
                    const tone = item.accent
                      ? getRecTypeAccent(item.accent)
                      : null;
                    return (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:bg-slate-900/60",
                        tone
                          ? tone.tileBorder
                          : "border-slate-200/70 dark:border-slate-700/60",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[10px] uppercase tracking-[0.14em]",
                          tone
                            ? tone.tileText
                            : "text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="text-lg font-black tracking-tight">
                        {item.value}
                      </p>
                    </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("statusLabel")}
                    </span>
                    <SegmentedControl<StatusFilter>
                      layoutId="library-status-filter"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      size="sm"
                      ariaLabel={t("statusLabel")}
                      options={[
                        {
                          value: "all",
                          label: t("filterAll"),
                          pillClassName: ALL_FILTER_PILL_CLASS,
                        },
                        ...STATUS_VALUES.map((s) => ({
                          value: s,
                          label: t(`status.${s}`),
                          pillClassName: STATUS_PILL_CLASSES[s],
                        })),
                      ]}
                    />
                  </div>
                  <ViewToggle
                    value={view}
                    onChange={setView}
                    className="shrink-0"
                  />
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {!loading && (
                <motion.div
                  key={`${mediumFilter}-${statusFilter}-${view}`}
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
                          ? t("empty.noItemsTitle")
                          : t("empty.noMatchesTitle")}
                      </h2>
                      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                        {items.length === 0
                          ? t("empty.noItemsBody")
                          : t("empty.noMatchesBody")}
                      </p>
                    </div>
                  ) : view === "grid" ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                      {filtered.map((item) => {
                        const accent = getRecTypeAccent(item.medium);
                        return (
                        <article
                          key={item.id}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-0 left-0 z-10 w-1",
                              accent.stripe,
                            )}
                          />
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
                                ) : item.medium === "music" ? (
                                  <Music size={28} />
                                ) : (
                                  <BookOpen size={28} />
                                )}
                              </div>
                            )}
                            <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                              <PillButton
                                onClick={() => setEditTarget(item)}
                                aria-label={t("editAria", { title: item.title })}
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
                                <StatusChipMenu item={item} variant="grid" />
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
                                        {t(`rating.${item.rating}`)}
                                      </span>
                                    );
                                  })()}
                              </div>
                            </div>
                          </div>
                        </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((item) => {
                        const accent = getRecTypeAccent(item.medium);
                        return (
                        <article
                          key={item.id}
                          className="group relative flex gap-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 pl-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-0 left-0 w-1",
                              accent.stripe,
                            )}
                          />
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
                                ) : item.medium === "music" ? (
                                  <Music size={24} />
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
                                    ? item.medium === "book"
                                      ? t("byAuthor", { creator: item.creator })
                                      : item.medium === "music"
                                        ? t("byArtist", {
                                            creator: item.creator,
                                          })
                                        : t("byDirector", {
                                            creator: item.creator,
                                          })
                                    : item.medium === "movie"
                                      ? t("mediumMovie")
                                      : item.medium === "music"
                                        ? t("mediumMusic")
                                        : t("mediumBook")}
                                  {item.year ? ` · ${item.year}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <PillButton
                                  onClick={() => setEditTarget(item)}
                                  aria-label={t("editAria", { title: item.title })}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                                >
                                  <Pencil size={13} />
                                </PillButton>
                                <PillButton
                                  onClick={() => void handleRemove(item)}
                                  variant="destructive"
                                  aria-label={t("removeAria", { title: item.title })}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                                >
                                  <Trash2 size={13} />
                                </PillButton>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusChipMenu item={item} />
                              {ratingChip(item.rating)}
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {t("loggedOn", {
                                  date: format(new Date(item.logged_at), "PP"),
                                })}
                              </span>
                            </div>

                            {item.reaction && (
                              <p className="mt-2 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-300">
                                &ldquo;{item.reaction}&rdquo;
                              </p>
                            )}
                          </div>
                        </article>
                        );
                      })}
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
  const t = useTranslations("Library");
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

    toast.success(t("updated"));
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
      ariaLabel={t("editDialog.ariaLabel")}
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
                  {t("editDialog.title")}
                </h2>
                <p
                  className="mt-2 truncate text-sm font-semibold text-slate-700 dark:text-slate-300"
                  title={target.title}
                >
                  {target.title}
                </p>

                <div className="mt-6 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("editDialog.statusHeader")}
                  </p>
                  <SegmentedControl<LibraryStatus>
                    layoutId="edit-dialog-status"
                    value={status}
                    onChange={setStatus}
                    size="sm"
                    ariaLabel={t("editDialog.statusHeader")}
                    options={STATUS_VALUES.map((s) => ({
                      value: s,
                      label: t(`status.${s}`),
                      pillClassName: STATUS_PILL_CLASSES[s],
                    }))}
                  />
                </div>

                <div className="mt-5 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("editDialog.ratingHeader")}
                  </p>
                  <SegmentedControl<LibraryRating>
                    layoutId="edit-dialog-rating"
                    value={rating}
                    onChange={setRating}
                    onClear={() => setRating(null)}
                    size="sm"
                    ariaLabel={t("editDialog.ratingHeader")}
                    options={[
                      {
                        value: 1,
                        label: t("rating.1"),
                        icon: <ThumbsDown size={14} />,
                        pillClassName: "bg-rose-500",
                      },
                      {
                        value: 2,
                        label: t("rating.2"),
                        icon: <Bookmark size={14} />,
                        pillClassName: "bg-slate-500",
                      },
                      {
                        value: 3,
                        label: t("rating.3"),
                        icon: <ThumbsUp size={14} />,
                        pillClassName: "bg-emerald-500",
                      },
                    ]}
                  />
                </div>

                <div className="mt-5 text-left">
                  <label
                    htmlFor="library-edit-reaction"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {t("editDialog.reactionHeader")}
                  </label>
                  <textarea
                    id="library-edit-reaction"
                    value={reaction}
                    onChange={(e) => setReaction(e.target.value.slice(0, 280))}
                    rows={3}
                    maxLength={280}
                    placeholder={t("editDialog.reactionPlaceholder")}
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
                    t("editDialog.save")
                  )}
                </Button>

                <button
                  onClick={onClose}
                  disabled={saving}
                  className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {t("editDialog.cancel")}
                </button>
              </div>
        </div>
      )}
    </Dialog>
  );
};
