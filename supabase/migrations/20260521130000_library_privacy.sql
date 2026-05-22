-- ── Library privacy ─────────────────────────────────────────────
-- A profile-level switch for whether the library shown on a profile
-- page is visible to other people. Defaults to public, matching the
-- social-feed posture (the owner can lock it down in Settings).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS library_public BOOLEAN NOT NULL DEFAULT TRUE;

-- Replace the own-only library SELECT policy with one that also exposes
-- a user's library when they've made it public — so profile pages can
-- render someone else's library / plan-to-watch.
DROP POLICY IF EXISTS "Users can view their own library"
  ON public.user_library;
DROP POLICY IF EXISTS user_library_select_public ON public.user_library;
CREATE POLICY user_library_select_public ON public.user_library
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_library.user_id
        AND p.library_public = TRUE
    )
  );
