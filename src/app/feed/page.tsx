"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Plus,
  Shuffle,
  Sparkles,
  Users,
  Compass,
  UserPlus,
  UsersRound,
  LayoutGrid,
  List,
  Globe2,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AppNavbar } from "@/components/app-navbar";
import {
  SidebarNavShell,
  SidebarNavGroup,
  SidebarNavItem,
  SidebarUser,
} from "@/components/sidebar-nav";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useFeedVisibility } from "@/features/feed/use-feed-visibility";
import { PageLoader } from "@/components/ui/loader";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { getRecTypeAccent } from "@/features/recommendations/utils/type-accent";
import { tmdbService } from "@/features/recommendations/services/tmdb-service";
import {
  useCreatePost,
  useUpdatePost,
  useFollowing,
  useSaved,
  useToggleSave,
  useVisibleFeed,
} from "@/features/feed/use-feed";
import { FollowButton } from "@/features/feed/components/follow-button";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import { PostMenuButton } from "@/features/feed/components/post-menu";
import { FinishWhatYouStartedBanner } from "@/features/library/components/finish-what-you-started-banner";
import { AiNudgeBanner } from "@/features/feed/components/ai-nudge-banner";
import { DashboardMovedBanner } from "@/features/feed/components/dashboard-moved-banner";
import { readFeedPrefs } from "@/features/feed/use-feed-prefs";
import {
  activityLabel,
  COMMUNITY_CONTENT,
  COMMUNITY_LABEL,
  COMMUNITY_TAG,
  agoLabel,
  type FeedActivity,
  type FeedCommunity,
  type FeedPost,
  type FeedScope,
} from "@/features/feed/types";

/** Per-segment hue. SegmentedControl reads the hue from `pillClassName`
 *  and renders the mobile style (soft tint + same-hue label) itself. */
const ACCENT = {
  violet: { pillClassName: "bg-violet-500" },
  indigo: { pillClassName: "bg-indigo-500" },
  rose: { pillClassName: "bg-rose-500" },
  amber: { pillClassName: "bg-amber-500" },
  emerald: { pillClassName: "bg-emerald-500" },
} as const;

const SCOPES = [
  { value: "friends" as FeedScope, label: "Friends", ...ACCENT.indigo },
  { value: "discover" as FeedScope, label: "Discover", ...ACCENT.violet },
  { value: "group" as FeedScope, label: "Group", ...ACCENT.rose },
] as const;

const SCOPE_NAV: ReadonlyArray<{
  id: FeedScope;
  label: string;
  icon: React.ReactNode;
  iconClassName: string;
}> = [
  {
    id: "friends",
    label: "Friends",
    icon: <Users size={16} />,
    iconClassName: "text-indigo-500 dark:text-indigo-400",
  },
  {
    id: "discover",
    label: "Discover",
    icon: <Compass size={16} />,
    iconClassName: "text-violet-500 dark:text-violet-400",
  },
  {
    id: "group",
    label: "Group",
    icon: <UsersRound size={16} />,
    iconClassName: "text-rose-500 dark:text-rose-400",
  },
];

const COMMUNITIES = [
  { value: "all" as FeedCommunity | "all", label: "All", ...ACCENT.violet },
  { value: "movies" as FeedCommunity | "all", label: "Movies", ...ACCENT.amber },
  { value: "books" as FeedCommunity | "all", label: "Books", ...ACCENT.emerald },
  { value: "music" as FeedCommunity | "all", label: "Music", ...ACCENT.rose },
] as const;

type FeedView = "cards" | "list";

const VIEWS: ReadonlyArray<{
  value: FeedView;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "cards", label: "Card view", icon: <LayoutGrid size={16} /> },
  { value: "list", label: "List view", icon: <List size={16} /> },
];

function tone(community: FeedCommunity) {
  return getAccentTone(COMMUNITY_CONTENT[community]);
}

/** Entrance: each post slides in from the left, staggered by row. */
function entrance(index: number) {
  return {
    initial: { opacity: 0, x: -28 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.32, delay: Math.min(index, 10) * 0.05 },
  } as const;
}

/* ─── Post card ─────────────────────────────────────────────────────── */

function PostCard({
  post,
  onOpen,
  onEdit,
  view,
  index,
}: {
  post: FeedPost;
  onOpen: () => void;
  onEdit: () => void;
  view: FeedView;
  index: number;
}) {
  const t = tone(post.community);
  const ribbon = getRecTypeAccent(COMMUNITY_CONTENT[post.community]).stripe;
  const { data: savedIds } = useSaved();
  const saved = (savedIds ?? []).includes(post.id);
  const toggleSave = useToggleSave();

  if (view === "list") {
    return (
      <motion.div
        layout
        {...entrance(index)}
        onClick={onOpen}
        className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 py-3 pl-5 pr-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65"
      >
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1", ribbon)}
        />
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
            t.iconCircle,
          )}
        >
          {COMMUNITY_TAG[post.community]}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold leading-tight text-slate-900 dark:text-slate-100">
            {post.title}
          </h3>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {post.author}
            </span>{" "}
            {activityLabel(post)} · {agoLabel(post.ageHours)}
          </p>
        </div>
        {post.tasteMatch > 0 && (
          <span
            className={cn(
              "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black sm:inline",
              t.iconCircle,
            )}
          >
            {post.tasteMatch}%
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1 text-slate-400 dark:text-slate-500">
          <MessageCircle size={14} />
          <span className="text-[11px] font-bold">{post.comments.length}</span>
        </span>
        <button
          type="button"
          aria-label={saved ? "Remove from library" : "Save to library"}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave.mutate(post.id, {
              onSuccess: (now) =>
                now
                  ? toast.success(`"${post.title}" saved to your library`)
                  : toast("Removed from your library"),
            });
          }}
          className={cn(
            "shrink-0 transition-transform hover:scale-110",
            saved ? t.text : "text-slate-400 dark:text-slate-500",
          )}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
        <PostMenuButton
          postId={post.id}
          postTitle={post.title}
          authorId={post.authorId}
          author={post.author}
          onEdit={onEdit}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      {...entrance(index)}
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 pl-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65"
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", ribbon)}
      />
      <div className="flex items-start gap-3">
        {/* Save / comment rail */}
        <div
          className="flex w-12 shrink-0 flex-col items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={saved ? "Remove from library" : "Save to library"}
            onClick={() => {
              toggleSave.mutate(post.id, {
                onSuccess: (now) =>
                  now
                    ? toast.success(
                        `"${post.title}" saved to your library`,
                      )
                    : toast("Removed from your library"),
              });
            }}
            className={cn(
              "transition-transform hover:scale-110",
              saved ? t.text : "text-slate-400 dark:text-slate-500",
            )}
          >
            {saved ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
          </button>
          <span
            className={cn(
              "text-[10px] font-extrabold",
              saved ? t.text : "text-slate-400 dark:text-slate-500",
            )}
          >
            {saved ? "Saved" : "Save"}
          </span>
          <div className="mt-2 flex flex-col items-center text-slate-400 dark:text-slate-500">
            <MessageCircle size={16} />
            <span className="text-[11px] font-bold">
              {post.comments.length}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black",
                t.iconCircle,
              )}
            >
              {COMMUNITY_TAG[post.community]}
            </span>
            <div className="flex items-center gap-1">
              {post.tasteMatch > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    t.iconCircle,
                  )}
                >
                  {post.tasteMatch}% your taste
                </span>
              )}
              <PostMenuButton
                postId={post.id}
                postTitle={post.title}
                authorId={post.authorId}
                author={post.author}
                onEdit={onEdit}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Link
              href={`/feed/u/${post.authorId ?? ""}`}
              onClick={(e) => e.stopPropagation()}
              className="group/author flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200"
            >
              <FeedAvatar
                name={post.author}
                url={post.authorAvatarUrl ?? undefined}
                size={22}
              />
              <span className="group-hover/author:underline">
                {post.author}
              </span>
            </Link>
            <span>
              {activityLabel(post)} · {agoLabel(post.ageHours)}
            </span>
            <span onClick={(e) => e.stopPropagation()}>
              <FollowButton
                authorId={post.authorId}
                authorName={post.author}
                size="sm"
              />
            </span>
          </div>

          <h3 className="mt-2 text-[15px] font-extrabold leading-tight text-slate-900 dark:text-slate-100">
            {post.title}
          </h3>

          {post.posterUrl && (
            <div className="mt-2.5 flex items-start gap-3">
              <Image
                src={post.posterUrl}
                alt=""
                width={52}
                height={post.community === "music" ? 52 : 78}
                unoptimized
                className="rounded-md object-cover"
              />
              {post.creator && (
                <p className="pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {post.creator}
                  {post.year ? ` · ${post.year}` : ""}
                </p>
              )}
            </div>
          )}

          {post.body && (
            <p className="mt-2 line-clamp-3 text-[13px] italic leading-relaxed text-slate-500 dark:text-slate-400">
              {post.body}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Composer ──────────────────────────────────────────────────────── */

const ACTIVITIES: ReadonlyArray<{
  value: FeedActivity;
  label: string;
  pillClassName: string;
}> = [
  { value: "finished", label: "Finished", pillClassName: "bg-emerald-500" },
  { value: "rated", label: "Rated", pillClassName: "bg-amber-500" },
  { value: "shared", label: "Recommending", pillClassName: "bg-violet-500" },
];

/** Three-way pick rating — shown in the composer when activity is "Rated".
 *  Mirrors the library's 1-3 scale (1 = Nope, 2 = Meh, 3 = Loved). */
const RATING_OPTIONS: ReadonlyArray<{
  value: number;
  label: string;
  pillClassName: string;
}> = [
  { value: 1, label: "👎 Nope", pillClassName: "bg-rose-500" },
  { value: 2, label: "😐 Meh", pillClassName: "bg-slate-500" },
  { value: 3, label: "👍 Loved", pillClassName: "bg-emerald-500" },
];

/** Per-community composer copy + the hover-glow hue (amber / emerald /
 *  rose), so the share-a-pick fields speak to the content type. */
const COMPOSER_COPY: Record<
  FeedCommunity,
  {
    glow: string;
    titlePlaceholder: string;
    creatorPlaceholder: string;
    takePlaceholder: string;
  }
> = {
  movies: {
    glow: "#f59e0b",
    titlePlaceholder: "What did you watch?",
    creatorPlaceholder: "Director (optional)",
    takePlaceholder: "Your take on it (optional)",
  },
  books: {
    glow: "#10b981",
    titlePlaceholder: "What did you read?",
    creatorPlaceholder: "Author (optional)",
    takePlaceholder: "Your take on it (optional)",
  },
  music: {
    glow: "#f43f5e",
    titlePlaceholder: "What did you listen to?",
    creatorPlaceholder: "Artist (optional)",
    takePlaceholder: "Your take on it (optional)",
  },
};

function Composer({
  open,
  onClose,
  editPost,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the composer edits this post instead of creating one.
   *  FeedPage keys the component by post id so this seeds state fresh. */
  editPost?: FeedPost;
}) {
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const [visibility] = useFeedVisibility();
  const isPrivate = visibility === "private";
  const [community, setCommunity] = useState<FeedCommunity>(
    editPost?.community ?? "movies",
  );
  const [activity, setActivity] = useState<FeedActivity>(
    editPost?.activity ?? "finished",
  );
  const [title, setTitle] = useState(editPost?.title ?? "");
  const [creator, setCreator] = useState(editPost?.creator ?? "");
  const [year, setYear] = useState(
    editPost?.year != null ? String(editPost.year) : "",
  );
  const [posterUrl, setPosterUrl] = useState(editPost?.posterUrl ?? "");
  const [body, setBody] = useState(editPost?.body ?? "");
  // Three-way rating, used only when activity is "rated". Defaults to Meh.
  const [rating, setRating] = useState(editPost?.rating ?? 2);
  // True while a TMDB cover-art lookup is in flight.
  const [findingCover, setFindingCover] = useState(false);

  function submit() {
    if (!title.trim() || createPost.isPending || updatePost.isPending) {
      return;
    }
    const parsedYear = Number.parseInt(year, 10);
    const fields = {
      community,
      title: title.trim(),
      activity,
      creator: creator || undefined,
      year: Number.isFinite(parsedYear) ? parsedYear : undefined,
      posterUrl: posterUrl.trim() || undefined,
      body: body || undefined,
      rating: activity === "rated" ? rating : undefined,
    };
    if (editPost) {
      updatePost.mutate(
        { postId: editPost.id, ...fields },
        {
          onSuccess: () => {
            toast.success("Pick updated");
            onClose();
          },
          onError: () =>
            toast.error("Couldn't save your changes — please try again."),
        },
      );
      return;
    }
    createPost.mutate(fields, {
      onSuccess: () => {
        toast.success(
          isPrivate
            ? "Saved to your picks — not broadcast (private profile)"
            : `Shared with ${COMMUNITY_LABEL[community]} friends`,
        );
        setTitle("");
        setCreator("");
        setYear("");
        setPosterUrl("");
        setBody("");
        setRating(2);
        onClose();
      },
      onError: () =>
        toast.error("Couldn't share your pick — please try again."),
    });
  }

  /** Movies only — look the title up via the tmdb-proxy and drop the
   *  poster (and year, if blank) into the form. The proxy returns a stock
   *  image on a miss, which we detect and treat as "nothing found". */
  async function findCover() {
    const query = title.trim();
    if (!query || findingCover) return;
    setFindingCover(true);
    try {
      const result = await tmdbService.searchMovie(query);
      const missPrefix =
        "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b";
      if (!result.poster || result.poster.startsWith(missPrefix)) {
        toast.error(`No cover art found for "${query}".`);
      } else {
        // A fresh match overwrites year + director so switching titles
        // re-fills them rather than keeping the previous movie's data.
        setPosterUrl(result.poster);
        if (result.year) setYear(String(result.year));
        if (result.director) setCreator(result.director);
      }
    } catch {
      toast.error("Couldn't search for cover art — please try again.");
    } finally {
      setFindingCover(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel={editPost ? "Edit pick" : "Share a pick"}
      size="md"
    >
      <div className="space-y-4 p-6">
        <h2 className="text-xl font-black tracking-tight">
          {editPost ? "Edit pick" : "Share a pick"}
        </h2>

        {isPrivate && (
          <div className="flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={14} className="mt-0.5 shrink-0" />
            <span>
              Your profile is private — this is saved to your picks but
              won&apos;t appear in other people&apos;s feeds.{" "}
              <Link
                href="/settings?section=feed"
                className="font-bold underline"
              >
                Change in Settings
              </Link>
            </span>
          </div>
        )}

        <SegmentedControl<FeedCommunity>
          layoutId="composer-community"
          value={community}
          onChange={setCommunity}
          options={COMMUNITIES.filter((c) => c.value !== "all").map((c) => ({
            value: c.value as FeedCommunity,
            label: c.label,
            pillClassName: c.pillClassName,
          }))}
          ariaLabel="Community"
        />
        <SegmentedControl<FeedActivity>
          layoutId="composer-activity"
          value={activity}
          onChange={setActivity}
          options={ACTIVITIES}
          ariaLabel="What did you do?"
        />
        {activity === "rated" && (
          <SegmentedControl<number>
            layoutId="composer-rating"
            value={rating}
            onChange={setRating}
            options={RATING_OPTIONS}
            ariaLabel="Your rating"
          />
        )}
        <Input
          glowColor={COMPOSER_COPY[community].glow}
          placeholder={COMPOSER_COPY[community].titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              glowColor={COMPOSER_COPY[community].glow}
              placeholder={COMPOSER_COPY[community].creatorPlaceholder}
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Input
              glowColor={COMPOSER_COPY[community].glow}
              placeholder="Year"
              value={year}
              inputMode="numeric"
              maxLength={4}
              onChange={(e) =>
                setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />
          </div>
        </div>
        <Input
          glowColor={COMPOSER_COPY[community].glow}
          placeholder="Poster image URL (optional)"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
        />
        {community === "movies" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!title.trim() || findingCover}
            onClick={findCover}
          >
            {findingCover ? "Searching…" : "Find cover art from title"}
          </Button>
        )}
        <textarea
          placeholder={COMPOSER_COPY[community].takePlaceholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{ ["--tw-ring-color" as string]: COMPOSER_COPY[community].glow }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
        />
        {title.trim() && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Preview
            </p>
            <div
              className="flex items-start gap-3 rounded-xl border bg-slate-50/80 p-3 dark:bg-slate-800/60"
              style={{ borderColor: `${COMPOSER_COPY[community].glow}55` }}
            >
              {posterUrl.trim() ? (
                <img
                  src={posterUrl.trim()}
                  alt=""
                  className="h-16 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-12 shrink-0 rounded-md bg-slate-200 dark:bg-slate-700" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-black uppercase tracking-wide"
                  style={{ color: COMPOSER_COPY[community].glow }}
                >
                  you{" "}
                  {activityLabel({
                    activity,
                    rating: activity === "rated" ? rating : undefined,
                  })}
                </p>
                <p className="mt-0.5 truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {title.trim()}
                </p>
                {(creator.trim() || year.trim()) && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {[creator.trim(), year.trim()]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <Button
          className="w-full"
          disabled={!title.trim()}
          onClick={submit}
        >
          {editPost
            ? "Save changes"
            : `Share with ${COMMUNITY_LABEL[community]}`}
        </Button>
      </div>
    </Dialog>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const [visibility] = useFeedVisibility();
  const { posts, isLoading: feedLoading, isError: feedError } =
    useVisibleFeed();
  const { data: followingIds } = useFollowing();
  const following = useMemo(
    () => new Set(followingIds ?? []),
    [followingIds],
  );
  const [scope, setScope] = useState<FeedScope>("friends");
  const [community, setCommunity] = useState<FeedCommunity | "all">("all");
  const [view, setView] = useState<FeedView>("cards");
  const [composer, setComposer] = useState(false);
  // When set, the composer opens in edit mode for this post.
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  // Apply the saved defaults once on mount (kept out of useState initialisers
  // so SSR/first render stays deterministic — same pattern as the prefs
  // hooks). The user can still switch freely afterwards this session.
  useEffect(() => {
    const p = readFeedPrefs();
    setScope(p.scope);
    setCommunity(p.community);
    setView(p.view);
  }, []);

  const visible = useMemo(() => {
    let list =
      community === "all"
        ? [...posts]
        : posts.filter((p) => p.community === community);
    if (scope === "friends") {
      list = list
        .filter((p) => p.activity !== "group")
        .filter(
          (p) =>
            following.size === 0 ||
            (p.authorId != null && following.has(p.authorId)),
        )
        .sort((a, b) => a.ageHours - b.ageHours);
    } else if (scope === "discover") {
      list = list
        .filter((p) => p.activity !== "group")
        .sort((a, b) => b.baseScore - a.baseScore);
    } else {
      list = list
        .filter((p) => p.activity === "group")
        .sort((a, b) => a.ageHours - b.ageHours);
    }
    return list;
  }, [posts, community, scope, following]);

  if (!ready) return <PageLoader text="Loading" />;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                Feed
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                What your people are into
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Picks, takes and group sessions from people you follow.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Link
                href="/settings?section=feed"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title="Manage your feed visibility in Settings"
              >
                {visibility === "private" ? (
                  <>
                    <Lock size={12} /> Private profile
                  </>
                ) : (
                  <>
                    <Globe2 size={12} /> Public profile
                  </>
                )}
              </Link>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => router.push("/feed/people")}
                  title="Find friends"
                  aria-label="Find friends"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                >
                  <UserPlus size={15} />
                </button>
                {/* Quiz launcher — single icon button with a 3-option menu.
                    Replaces the redundant "Start Quiz" CTAs that used to
                    live on Dashboard/Library/History headers. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      title="Start a quiz"
                      aria-label="Start a quiz"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                    >
                      <Sparkles size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem
                      onSelect={() => router.push("/quiz")}
                      className="gap-2"
                    >
                      <Sparkles size={14} />
                      Solo quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => router.push("/group-quiz")}
                      className="gap-2"
                    >
                      <UsersRound size={14} />
                      Group quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => router.push("/quiz?mode=surprise")}
                      className="gap-2"
                    >
                      <Shuffle size={14} />
                      Surprise me
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setComposer(true)} className="gap-1.5">
                  <Plus size={16} /> Share a pick
                </Button>
              </div>
            </div>
          </div>

          <DashboardMovedBanner />
          <FinishWhatYouStartedBanner />
          <AiNudgeBanner />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell className="hidden md:flex">
              <nav aria-label="Feed scope" className="flex-1">
                <SidebarNavGroup label="Scope" />
                {SCOPE_NAV.map((s) => (
                  <SidebarNavItem
                    key={s.id}
                    icon={s.icon}
                    label={s.label}
                    active={scope === s.id}
                    iconClassName={s.iconClassName}
                    onClick={() => setScope(s.id)}
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
              <div className="mb-2 md:hidden">
                <SegmentedControl<FeedScope>
                  layoutId="feed-scope-m"
                  value={scope}
                  onChange={setScope}
                  options={SCOPES}
                  ariaLabel="Feed scope"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <SegmentedControl<FeedCommunity | "all">
                    layoutId="feed-community"
                    value={community}
                    onChange={setCommunity}
                    options={COMMUNITIES}
                    ariaLabel="Community"
                  />
                </div>
                <SegmentedControl<FeedView>
                  layoutId="feed-view"
                  value={view}
                  onChange={setView}
                  options={VIEWS}
                  ariaLabel="Layout"
                  iconOnly
                />
              </div>
              <div
                key={`${scope}-${community}-${view}`}
                className={cn("mt-5", view === "list" ? "space-y-2" : "space-y-3")}
              >
                {feedLoading ? (
                  <div className="py-16 text-center text-sm text-slate-400">
                    Loading your feed…
                  </div>
                ) : feedError ? (
                  <div className="rounded-3xl border border-rose-200/70 bg-rose-50/60 p-10 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                      We couldn&apos;t load your feed. Please try again.
                    </p>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
                    <Users
                      className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600"
                      aria-hidden="true"
                    />
                    <h2 className="mt-4 text-xl font-black tracking-tight text-slate-700 dark:text-slate-200">
                      Nothing here yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Follow people or share a pick of your own — your
                      feed fills up as your taste graph grows.
                    </p>
                  </div>
                ) : (
                  visible.map((p, i) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      index={i}
                      view={view}
                      onOpen={() => router.push(`/feed/${p.id}`)}
                      onEdit={() => setEditingPost(p)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <Composer
            key={editingPost?.id ?? "new"}
            open={composer || editingPost !== null}
            editPost={editingPost ?? undefined}
            onClose={() => {
              setComposer(false);
              setEditingPost(null);
            }}
          />
        </div>
      </main>
    </div>
  );
}
