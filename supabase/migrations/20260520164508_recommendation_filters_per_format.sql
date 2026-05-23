-- =============================================================
-- Recommendation filters — per-format shape
-- =============================================================
-- The filter blob is now split per format so the user can avoid
-- a genre on Movies without nuking the same word on Books / Music.
--
-- New shape (any slice optional):
--   {
--     "movie": { avoidGenres, maxRuntimeMinutes, language, avoidNote },
--     "book":  { avoidGenres, language, avoidNote },
--     "music": { avoidGenres, language, avoidNote }
--   }
--
-- The application reader (cleanRecommendationFilters) still accepts the
-- legacy single-bucket blob `{ avoidGenres, maxRuntimeMinutes, language,
-- avoidNote }` and lifts it into every format slice, so existing rows keep
-- working with no data migration. New writes always use the per-format
-- shape.

COMMENT ON COLUMN public.profiles.recommendation_filters IS
  'Per-format taste-tuning hard filters: { movie: { avoidGenres, maxRuntimeMinutes, language, avoidNote }, book: { avoidGenres, language, avoidNote }, music: { avoidGenres, language, avoidNote } }. NULL = no filters. Legacy single-bucket shape is still accepted on read.';
