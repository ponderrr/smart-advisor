-- ============================================================
-- Feed: post up/down votes + comment edit timestamp
-- ============================================================
-- Mirrors feed_comment_votes onto posts so the post card can show a
-- Reddit-style score, and adds edited_at to feed_comments so authors
-- can fix typos in their comments (the UI shows "(edited)" once set).
--
-- RLS matches feed_comment_votes: votes are world-readable for the
-- score aggregates other users see, but only the owner can write their
-- own row. The existing feed_comments_update policy already covers
-- author-only comment edits.

-- ── feed_comments.edited_at ──────────────────────────────────
ALTER TABLE public.feed_comments
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ── feed_post_votes — one vote per user per post ─────────────
CREATE TABLE IF NOT EXISTS public.feed_post_votes (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS feed_post_votes_post_idx
  ON public.feed_post_votes (post_id);

ALTER TABLE public.feed_post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_post_votes_select" ON public.feed_post_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_post_votes_insert" ON public.feed_post_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_post_votes_update" ON public.feed_post_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_post_votes_delete" ON public.feed_post_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
