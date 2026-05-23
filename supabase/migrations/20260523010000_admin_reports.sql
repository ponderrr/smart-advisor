-- =============================================================
-- profiles.is_admin + admin-readable feed_reports
-- =============================================================
-- Adds a single staff flag on profiles so a small in-app
-- moderation surface (Settings → Reports) can read the otherwise
-- write-only feed_reports table. End users still cannot read
-- anyone else's reports — only rows where they are the reporter
-- (via the pre-existing feed_reports_select_own policy) or rows
-- they can see because they're flagged is_admin.
--
-- Bootstrapping: the column defaults to FALSE. To grant yourself
-- admin, run from the Supabase SQL editor (service role bypasses
-- the column REVOKE below):
--     UPDATE profiles SET is_admin = TRUE WHERE email = '<you>';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Defence in depth: clients absolutely must not be able to elevate
-- themselves. The existing "profiles_update" policy allows owners
-- to UPDATE their own row, but column-level REVOKE means an
-- `UPDATE profiles SET is_admin = TRUE` from a client errors out
-- before any policy is even evaluated. Only the service role can
-- write the column.
REVOKE UPDATE (is_admin) ON public.profiles FROM authenticated, anon;

-- Admins may read every report (used by the in-app Reports
-- screen). The owner-only feed_reports_select_own policy stays —
-- the two are additive (a row is visible if either matches).
CREATE POLICY "feed_reports_select_admin" ON public.feed_reports
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin
  ));

COMMENT ON COLUMN public.profiles.is_admin IS
  'Staff flag. Server-write-only (column-level REVOKE on '
  'authenticated). Unlocks the in-app Reports moderation screen '
  'and the feed_reports_select_admin RLS policy.';
