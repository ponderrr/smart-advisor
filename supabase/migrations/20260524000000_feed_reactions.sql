-- ============================================================
-- Feed: emoji reactions on posts and comments
-- ============================================================
-- One row per user / target. `target_kind` discriminates between
-- posts and comments so a single table backs both. A user can
-- only have ONE reaction per target — tapping a different emoji
-- replaces the previous one (upsert on the PK). Tapping the same
-- emoji clears it (delete).
--
-- The set of allowed emoji is enforced server-side via CHECK so
-- the client can't smuggle arbitrary strings into the column.
-- Add to the CHECK list when you add a new picker option.
--
-- RLS mirrors feed_comment_votes: world-readable for the per-target
-- aggregates everyone sees, but only the owner can write their own
-- row. Hiding reactions from blocked users is done client-side in
-- the app query (same pattern as feed_posts), not in RLS.

-- ── feed_reactions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  user_id     UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_kind TEXT        NOT NULL CHECK (target_kind IN ('post', 'comment')),
  target_id   UUID        NOT NULL,
  emoji       TEXT        NOT NULL
    CHECK (emoji IN ('❤️', '🔥', '😂', '😢', '🤔', '👏')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, target_kind, target_id)
);

-- Lookups are always "give me all reactions for these targets" —
-- the index supports both the per-target join and the post-list
-- fan-in used by the feed screen.
CREATE INDEX IF NOT EXISTS feed_reactions_target_idx
  ON public.feed_reactions (target_kind, target_id);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_reactions_select" ON public.feed_reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_reactions_insert" ON public.feed_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_reactions_update" ON public.feed_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_reactions_delete" ON public.feed_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
