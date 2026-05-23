-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: "About me" customization — a short bio, curated interest tags
-- chosen from a fixed set, and freeform user-authored tags. interests/tags
-- default to empty arrays so existing rows need no backfill.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT
    CHECK (bio IS NULL OR char_length(bio) <= 300),
  ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
