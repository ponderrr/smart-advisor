-- =============================================================
-- Add "music" as a third recommendation category.
-- Expands CHECK constraints, adds artist + preview_url columns.
-- =============================================================

-- recommendations: per-row type + per-session content_type
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_type_check;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_type_check
  CHECK (type IN ('movie', 'book', 'music'));

ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_content_type_check;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_content_type_check
  CHECK (content_type IN ('movie', 'book', 'music', 'both', 'mix'));

ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS artist TEXT;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- quiz_sessions: hosts can pick music or mix for group sessions too
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_content_type_check;
ALTER TABLE public.quiz_sessions ADD CONSTRAINT quiz_sessions_content_type_check
  CHECK (content_type IN ('movie', 'book', 'music', 'both', 'mix'));

-- user_library: users can log albums alongside movies and books
ALTER TABLE public.user_library DROP CONSTRAINT IF EXISTS user_library_medium_check;
ALTER TABLE public.user_library ADD CONSTRAINT user_library_medium_check
  CHECK (medium IN ('movie', 'book', 'music'));
