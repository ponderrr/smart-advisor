-- =============================================================
-- feed_reports_readable: human-readable join over feed_reports
-- =============================================================
-- The raw feed_reports table is a forest of UUIDs (reporter_id,
-- post_id, comment_id), so triaging by hand in the Supabase
-- dashboard is painful. This view joins in usernames and the
-- post/comment body so a single SELECT tells you who reported
-- what, why, and what the offending content actually says.
--
-- Visibility: no GRANT to authenticated or anon, so only the
-- service role (Supabase dashboard / SQL editor) can read it.
-- Reports themselves stay write-only for end users via the
-- existing RLS on the base table; this view doesn't widen
-- anything, it just decodes the IDs the dashboard already sees.

CREATE OR REPLACE VIEW public.feed_reports_readable
WITH (security_invoker = false)
AS SELECT
  r.id,
  r.created_at,
  r.reason,
  reporter.username     AS reporter,
  reporter.name         AS reporter_name,
  -- Post target (NULL when the report is on a comment).
  p.title               AS post_title,
  p.body                AS post_body,
  p.community           AS post_community,
  post_author.username  AS post_author,
  -- Comment target (NULL when the report is on a post).
  c.body                AS comment_body,
  cp.title              AS comment_on_post_title,
  comment_author.username AS comment_author,
  -- Original IDs kept around so you can jump back to the raw row.
  r.post_id,
  r.comment_id,
  r.reporter_id
FROM public.feed_reports r
LEFT JOIN public.profiles      reporter       ON reporter.id       = r.reporter_id
LEFT JOIN public.feed_posts    p              ON p.id              = r.post_id
LEFT JOIN public.profiles      post_author    ON post_author.id    = p.user_id
LEFT JOIN public.feed_comments c              ON c.id              = r.comment_id
LEFT JOIN public.feed_posts    cp             ON cp.id             = c.post_id
LEFT JOIN public.profiles      comment_author ON comment_author.id = c.user_id
ORDER BY r.created_at DESC;

-- Defence in depth: explicitly strip any inherited privileges so
-- the view cannot be queried by clients even if default grants
-- on `public` ever change.
REVOKE ALL ON public.feed_reports_readable FROM PUBLIC;
REVOKE ALL ON public.feed_reports_readable FROM authenticated, anon;

COMMENT ON VIEW public.feed_reports_readable IS
  'Service-role-only triage view: feed_reports joined with reporter '
  'and target (post or comment) so dashboard rows are readable at a '
  'glance. No client GRANT — base table RLS is unchanged.';
