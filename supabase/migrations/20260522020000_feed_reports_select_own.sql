-- ─────────────────────────────────────────────────────────────────────────────
-- feed_reports: let users read back the reports THEY filed, for the
-- Settings "Reports you've filed" list. The table stays insert-only
-- otherwise — no one can read anyone else's reports.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "feed_reports_select_own" ON public.feed_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
