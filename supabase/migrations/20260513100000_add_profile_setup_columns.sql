-- =============================================================
-- Onboarding profile columns
-- =============================================================
-- Adds the three fields the post-signup onboarding step captures:
--   • content_tone — family vs standard. Read by the AI service to
--     scope rec content; previously localStorage-only.
--   • locale — user's chosen UI language. Already persisted via
--     cookie pre-signup, but now also locked to the account so it
--     survives cookie clears and device changes.
--   • setup_completed_at — when the user finished (or skipped) the
--     onboarding screen. NULL means it hasn't run yet.
--
-- Existing rows are backfilled with setup_completed_at = created_at
-- so the dashboard guard doesn't force pre-existing users through a
-- flow they never had a chance to see.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS content_tone TEXT
    CHECK (content_tone IS NULL OR content_tone IN ('family', 'standard')),
  ADD COLUMN IF NOT EXISTS locale TEXT
    CHECK (locale IS NULL OR locale IN ('en', 'es')),
  ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

UPDATE public.profiles
  SET setup_completed_at = COALESCE(setup_completed_at, created_at, NOW())
  WHERE setup_completed_at IS NULL;
