-- ─────────────────────────────────────────────────────────────────────────
-- profiles: per-format tags
-- ─────────────────────────────────────────────────────────────────────────
-- Splits the existing freeform `tags` array into three format-specific
-- arrays so users can express "I like noir movies / scifi books / lofi
-- music" with the structure intact on the profile page. Mirrors the
-- three-content-type model already baked into the rest of the app
-- (FeedCommunity, COMMUNITY_CONTENT, the quiz).
--
-- Legacy `tags` column stays in place so existing data isn't lost; the
-- profile editor stops surfacing it, so it goes dormant. A later
-- migration can drop it once we've confirmed nothing depends on it.
--
-- profiles_public is recreated because views snapshot their column list
-- at creation time — even `CREATE OR REPLACE VIEW` keeps the old shape
-- when the new SELECT adds columns unless the view is dropped first.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS movie_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS book_tags  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS music_tags TEXT[] NOT NULL DEFAULT '{}';

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS SELECT
  id,
  name,
  username,
  avatar_url,
  bio,
  interests,
  tags,
  movie_tags,
  book_tags,
  music_tags,
  library_public,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

COMMENT ON VIEW public.profiles_public IS
  'Public-safe projection of profiles for cross-account reads. '
  'Excludes email, age, backup_email and any other owner-only '
  'columns. Per-format tag columns added 2026-05-24.';
