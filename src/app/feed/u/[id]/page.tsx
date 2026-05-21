"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import {
  useFeedProfile,
  useFollowerCount,
  useFollowing,
  useUserPosts,
} from "@/features/feed/use-feed";
import { FollowButton } from "@/features/feed/components/follow-button";
import { BlockButton } from "@/features/feed/components/block-button";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import {
  ACTIVITY_VERB,
  COMMUNITY_CONTENT,
  COMMUNITY_TAG,
  agoLabel,
} from "@/features/feed/types";

export default function FeedProfilePage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const profileId = params?.id ?? "";
  const isYou = profileId === user?.id;

  const { data: profile, isLoading: profileLoading } =
    useFeedProfile(profileId);
  const { data: posts } = useUserPosts(profileId);
  const { data: followerCount } = useFollowerCount(profileId);
  const { data: followingIds } = useFollowing();

  if (!ready) return <PageLoader text="Loading" />;

  const authored = posts ?? [];
  const isFollowing = (followingIds ?? []).includes(profileId);
  const followers = (followerCount ?? 0) + (isFollowing ? 1 : 0);
  const name = profile?.name ?? "Someone";

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-x-0.5 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200"
          >
            <ArrowLeft size={14} /> Back to feed
          </button>

          {profileLoading && !profile ? (
            <p className="py-16 text-center text-sm text-slate-400">
              Loading profile…
            </p>
          ) : (
            <>
              {/* Profile header */}
              <div className="flex flex-col items-start gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center dark:border-slate-700/70 dark:bg-slate-900/65">
                <FeedAvatar
                  name={name}
                  url={profile?.avatarUrl ?? undefined}
                  size={64}
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-black tracking-tight">
                    {isYou ? "You" : name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {followers.toLocaleString()} followers · {authored.length}{" "}
                    {authored.length === 1 ? "pick" : "picks"}
                  </p>
                </div>
                {!isYou && (
                  <div className="flex items-center gap-2">
                    <FollowButton authorId={profileId} authorName={name} />
                    <BlockButton authorId={profileId} authorName={name} />
                  </div>
                )}
              </div>

              {/* Their picks */}
              <h2 className="mb-3 mt-8 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {isYou ? "Your picks" : `${name}'s picks`}
              </h2>
              <div className="space-y-3">
                {authored.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300/80 bg-white/60 py-12 text-center text-sm text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/50">
                    Nothing shared yet.
                  </p>
                ) : (
                  authored.map((p) => {
                    const t = getAccentTone(COMMUNITY_CONTENT[p.community]);
                    return (
                      <Link
                        key={p.id}
                        href={`/feed/${p.id}`}
                        className="block rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-black",
                              t.iconCircle,
                            )}
                          >
                            {COMMUNITY_TAG[p.community]}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ACTIVITY_VERB[p.activity]} ·{" "}
                            {agoLabel(p.ageHours)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-[15px] font-extrabold leading-tight text-slate-900 dark:text-slate-100">
                          {p.title}
                        </h3>
                        {p.body && (
                          <p className="mt-1.5 line-clamp-2 text-[13px] italic text-slate-500 dark:text-slate-400">
                            {p.body}
                          </p>
                        )}
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          <MessageCircle size={13} />
                          {p.comments.length} comments
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
