-- =============================================================
-- Feed backend — real tables for the taste-graph social feed
-- =============================================================
-- Replaces the in-memory mock feed (seed posts + a Notifier) with
-- persisted Supabase tables. The feed starts empty: posts carry a real
-- user_id FK, so the old fake-author seed data is intentionally dropped.
--
-- Tables: feed_posts, feed_comments, feed_follows, feed_blocks,
-- feed_saves, feed_comment_votes. Author name/avatar is joined from
-- public.profiles (id == auth.users.id).
--
-- RLS model: the feed is a logged-in-only social surface, so posts /
-- comments / the follow graph / comment votes are readable by ANY
-- authenticated user (needed for follower counts + score aggregates).
-- Writes are restricted to the owning row. Blocks are private to the
-- blocker. Hiding blocked authors' posts is done in the app query, not
-- RLS — a per-row correlated subquery would be far more expensive.

-- ── feed_posts ───────────────────────────────────────────────
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  community TEXT NOT NULL CHECK (community IN ('movies', 'books', 'music')),
  activity TEXT NOT NULL
    CHECK (activity IN ('finished', 'added', 'rated', 'shared', 'group')),
  title TEXT NOT NULL,
  body TEXT,
  poster_url TEXT,
  creator TEXT,
  year INTEGER,
  -- Popularity seed used to order the Discover scope.
  base_score INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── feed_comments — Reddit-style threading via parent_id ─────
CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- NULL = top-level comment; otherwise a reply to another comment.
  parent_id UUID REFERENCES public.feed_comments (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── feed_follows — directed follow graph ─────────────────────
CREATE TABLE public.feed_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

-- ── feed_blocks — private to the blocker ─────────────────────
CREATE TABLE public.feed_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ── feed_saves — bookmarked posts ────────────────────────────
CREATE TABLE public.feed_saves (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ── feed_comment_votes — one vote per user per comment ───────
CREATE TABLE public.feed_comment_votes (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL
    REFERENCES public.feed_comments (id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- ── indexes ──────────────────────────────────────────────────
CREATE INDEX feed_posts_created_at_idx
  ON public.feed_posts (created_at DESC);
CREATE INDEX feed_posts_user_id_idx ON public.feed_posts (user_id);
CREATE INDEX feed_posts_community_idx ON public.feed_posts (community);
CREATE INDEX feed_comments_post_id_idx ON public.feed_comments (post_id);
CREATE INDEX feed_follows_follower_idx
  ON public.feed_follows (follower_id);
CREATE INDEX feed_follows_followee_idx
  ON public.feed_follows (followee_id);
CREATE INDEX feed_blocks_blocker_idx ON public.feed_blocks (blocker_id);
CREATE INDEX feed_comment_votes_comment_idx
  ON public.feed_comment_votes (comment_id);

-- ── row level security ───────────────────────────────────────
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comment_votes ENABLE ROW LEVEL SECURITY;

-- feed_posts: every authenticated user reads the whole feed; writes own.
CREATE POLICY "feed_posts_select" ON public.feed_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_posts_insert" ON public.feed_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_posts_update" ON public.feed_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_posts_delete" ON public.feed_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- feed_comments: readable by all authenticated; writes own.
CREATE POLICY "feed_comments_select" ON public.feed_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_comments_insert" ON public.feed_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_comments_update" ON public.feed_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_comments_delete" ON public.feed_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- feed_follows: the graph is public (follower counts); you write your own.
CREATE POLICY "feed_follows_select" ON public.feed_follows
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_follows_insert" ON public.feed_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "feed_follows_delete" ON public.feed_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- feed_blocks: private to the blocker.
CREATE POLICY "feed_blocks_select" ON public.feed_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "feed_blocks_insert" ON public.feed_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "feed_blocks_delete" ON public.feed_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- feed_saves: fully private to the owner.
CREATE POLICY "feed_saves_select" ON public.feed_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_saves_insert" ON public.feed_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_saves_delete" ON public.feed_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- feed_comment_votes: readable by all (score aggregates); writes own.
CREATE POLICY "feed_comment_votes_select" ON public.feed_comment_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_comment_votes_insert" ON public.feed_comment_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_comment_votes_update" ON public.feed_comment_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_comment_votes_delete" ON public.feed_comment_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
