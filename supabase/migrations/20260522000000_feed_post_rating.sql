-- ─────────────────────────────────────────────────────────────────────────────
-- feed_posts.rating — optional three-way pick rating for shared picks.
-- Mirrors the library's scale: 1 = Nope, 2 = Meh, 3 = Loved. Only meaningful
-- when activity = 'rated'; NULL for every other activity.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS rating SMALLINT
    CHECK (rating IS NULL OR rating BETWEEN 1 AND 3);
