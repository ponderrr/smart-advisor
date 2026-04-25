-- =============================================================
-- Fix user_library unique index for ON CONFLICT upserts.
-- =============================================================
-- The original index used LOWER(title) as an expression, which
-- Postgres can't match against ON CONFLICT (user_id, medium, title)
-- — the upsert path therefore failed with 42P10 ("no unique or
-- exclusion constraint matching the ON CONFLICT specification").
--
-- Replace it with a plain unique index on the same columns.

DROP INDEX IF EXISTS public.user_library_user_title_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_library_user_title_key
  ON public.user_library (user_id, medium, title);
