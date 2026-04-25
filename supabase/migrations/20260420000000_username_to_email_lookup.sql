-- Allows anonymous sign-in by username. The profiles table is RLS-locked to
-- `auth.uid() = id`, so an unauthenticated client cannot query it directly.
-- This function runs with definer privileges and returns only the email for
-- a single username, letting the client translate "username → email" before
-- calling Supabase's signInWithPassword.

-- Ensure the username column exists. The canonical schema declares it, but
-- older DB snapshots may have been initialized without it.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Case-insensitive lookup index. Not UNIQUE here to avoid failing on any
-- pre-existing duplicates; uniqueness enforcement can be added in a later
-- cleanup migration once historical data is deduped.
CREATE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (LOWER(username));

CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE username ILIKE p_username
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_email_for_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;
