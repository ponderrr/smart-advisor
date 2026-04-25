-- =============================================================
-- USER LIBRARY — taste profile signal
-- =============================================================
-- Tracks what each user has watched/read, with an optional rating
-- and one-line reaction. Used both as a personal "things I've
-- consumed" log and as a taste signal injected into the recommend-
-- ation prompt so future picks reflect actual reactions.
--
-- Columns are denormalized (title, creator, year, poster_url copied
-- in at log time) because the existing recommendation.id is a hash
-- of title+year and isn't a stable foreign key across sessions.

CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('movie', 'book')),
  title TEXT NOT NULL,
  creator TEXT,            -- director (movie) or author (book)
  year INT,
  poster_url TEXT,
  status TEXT NOT NULL DEFAULT 'finished'
    CHECK (status IN ('finished', 'in_progress', 'wishlist')),
  -- 1 = thumbs-down, 2 = neutral, 3 = thumbs-up. NULL = no rating yet.
  rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 3),
  reaction TEXT,           -- short free-text note, capped client-side
  source_recommendation_id UUID,  -- optional pointer to the rec it came from
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_library_user
  ON public.user_library(user_id, logged_at DESC);

-- Soft dedupe: at most one row per (user, medium, title).
-- Year is intentionally excluded — different editions/years of the
-- same title shouldn't create separate rows for casual logging.
-- A plain unique index (no LOWER()) is required so the upsert's
-- ON CONFLICT (user_id, medium, title) clause finds a match.
CREATE UNIQUE INDEX IF NOT EXISTS user_library_user_title_key
  ON public.user_library (user_id, medium, title);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own library" ON public.user_library;
CREATE POLICY "Users can view their own library"
  ON public.user_library FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own library" ON public.user_library;
CREATE POLICY "Users can insert into their own library"
  ON public.user_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own library" ON public.user_library;
CREATE POLICY "Users can update their own library"
  ON public.user_library FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their own library" ON public.user_library;
CREATE POLICY "Users can delete from their own library"
  ON public.user_library FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;

-- Keep updated_at fresh on every row change.
CREATE OR REPLACE FUNCTION public.touch_user_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_library_set_updated_at ON public.user_library;
CREATE TRIGGER user_library_set_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_library_updated_at();
