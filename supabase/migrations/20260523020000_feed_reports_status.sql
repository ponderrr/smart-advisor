-- =============================================================
-- feed_reports moderation status + admin UPDATE policy
-- =============================================================
-- Adds a status field so the in-app Reports moderation screen
-- can mark each report as reviewed (legit, action taken) or
-- dismissed (not actionable), and stamp who closed it. The
-- existing select_admin policy already lets admins read every
-- report; this migration adds the matching UPDATE policy.

ALTER TABLE public.feed_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'dismissed')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID
    REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS feed_reports_status_created_idx
  ON public.feed_reports (status, created_at DESC);

-- Only admins can resolve a report.
CREATE POLICY "feed_reports_update_admin" ON public.feed_reports
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin
  ));

COMMENT ON COLUMN public.feed_reports.status IS
  'Moderation triage state: open (default) | reviewed (action taken) '
  '| dismissed (not actionable). Set by admins via the in-app Reports '
  'screen — feed_reports_update_admin RLS gates the write.';
