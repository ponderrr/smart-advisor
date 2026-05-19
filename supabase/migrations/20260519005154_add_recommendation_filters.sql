-- =============================================================
-- Recommendation filters (taste tuning / hard filters)
-- =============================================================
-- One JSONB blob holding the user's explicit dislikes + hard
-- content constraints. Read by the AI service and threaded into
-- the recommendation prompt as HARD CONSTRAINTS so picks respect
-- them across every rec path (quiz, surprise).
--
-- Shape:
--   {
--     "avoidGenres": string[],          -- genres to never pick
--     "maxRuntimeMinutes": int | null,  -- movie runtime cap
--     "language": string | null,        -- preferred language
--     "avoidNote": string | null        -- free-text "never recommend"
--   }
--
-- Nullable / default NULL: existing rows simply have no filters and
-- behaviour is unchanged. Column lives on the already-RLS'd profiles
-- table (same table the onboarding profile-setup migration altered),
-- so no policy changes are needed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recommendation_filters JSONB;

COMMENT ON COLUMN public.profiles.recommendation_filters IS
  'Taste tuning / hard filters: { avoidGenres: string[], maxRuntimeMinutes: int|null, language: string|null, avoidNote: string|null }. NULL = no filters.';
