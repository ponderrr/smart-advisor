-- =============================================================
-- profiles_public: cross-account safe projection
-- =============================================================
-- The canonical `profiles_select` policy is owner-only (auth.uid()
-- = id). That means embeds like `author:profiles(...)` from
-- feed_posts / feed_comments return NULL for any profile other
-- than your own — and that cascades into "Someone" display names,
-- empty author IDs (which then break isOwn checks on the
-- three-dot menu and hide Edit/Delete on your own posts when the
-- viewer comes from another account), and a "post isn't
-- available" deep-link fallback. The same RLS subquery breaks
-- public-library visibility (`p.library_public = TRUE` EXISTS
-- check filters to own rows only).
--
-- Fix: expose only the public-safe columns via a view that
-- bypasses the underlying RLS (security_invoker = false runs the
-- view's query as the view OWNER, which has unrestricted SELECT
-- on the base table). Sensitive columns (email, age,
-- backup_email, content_tone in some product contexts) stay
-- locked behind the existing owner-only policy on the base
-- `profiles` table.
--
-- Embeds in client code switch from `profiles` to
-- `profiles_public`; PostgREST retains FK relationships for
-- single-table views so `author:profiles_public!feed_posts_user_id_fkey`
-- continues to resolve.

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false)
AS SELECT
  id,
  name,
  username,
  avatar_url,
  bio,
  interests,
  tags,
  library_public,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

COMMENT ON VIEW public.profiles_public IS
  'Public-safe projection of profiles for cross-account reads '
  '(feed authors, follower lists, profile pages, public-library '
  'visibility). Excludes email, age, backup_email and any other '
  'PII columns that should stay owner-only on the base table.';
