-- ── feed_reports — user-filed reports on a post or comment ───────
-- Write-only for users: they insert their own reports and cannot read
-- them back, so the table is effectively private to staff (reviewed via
-- the service-role / dashboard). Exactly one of post_id / comment_id is
-- set per row.
CREATE TABLE public.feed_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.feed_comments (id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX feed_reports_created_idx
  ON public.feed_reports (created_at DESC);

ALTER TABLE public.feed_reports ENABLE ROW LEVEL SECURITY;

-- Users may file a report under their own id; there is intentionally no
-- SELECT/UPDATE/DELETE policy, so reports aren't readable by users.
CREATE POLICY "feed_reports_insert" ON public.feed_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
