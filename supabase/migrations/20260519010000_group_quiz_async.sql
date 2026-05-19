-- Group Quiz: ASYNC mode. Members answer on their own time before a
-- deadline; the session resolves (computes the group pick) when all joined
-- participants have submitted OR the deadline passes — whichever comes
-- first. Optional planned get-together date.
--
-- Strictly additive / backward-compatible: both columns are NULLABLE with
-- NO default, so existing live rows are unchanged and a NULL deadline_at
-- continues to mean "this is a live/realtime session" — the live state
-- machine and all its code paths are untouched.
--
--   deadline_at  presence (NOT NULL) ⇒ this is an async session; the
--                timestamp answers are collected until.
--   planned_for  optional "let's do it together on <date>" note; purely
--                informational, no behavioural effect.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS planned_for TIMESTAMPTZ NULL;

-- No status enum/CHECK change: async reuses the existing
-- 'lobby' → 'in_progress' → 'completed' lifecycle (an async session goes
-- straight to 'in_progress' once questions are generated, and 'completed'
-- when it resolves), so the CHECK constraint and every status value stay
-- exactly as before.
--
-- No RLS change: the existing policies already cover every async need —
--   * quiz_sessions_select  (USING TRUE)            → any participant can
--     read the session row regardless of status / host being live.
--   * quiz_answers_insert / quiz_answers_update     → gated only on the
--     caller being a participant of the session (NOT on session status or
--     the host being present), so a member can submit their own answers
--     asynchronously at any time before resolution.
--   * quiz_participants_select (USING TRUE)         → the "N of M
--     submitted" count is readable by everyone.
--   * quiz_sessions_host_update                     → resolution writes
--     result/status/completed_at; the resolving client is the host on the
--     all-submitted path. For the deadline-passed path the resolver may be
--     a non-host participant, which the host-only UPDATE policy blocks.
--
-- The ONLY additive RLS addition below is a brand-new, tightly-scoped
-- UPDATE policy that lets a *joined participant* finalize an *expired
-- async* session. It cannot affect live mode: it requires
-- deadline_at IS NOT NULL (live sessions are always NULL) AND
-- now() >= deadline_at AND the row is not already completed. No existing
-- policy is altered or dropped — this is purely an extra permissive
-- policy that broadens UPDATE only for this exact, safe case.

DROP POLICY IF EXISTS quiz_sessions_async_resolve_update
  ON public.quiz_sessions;
CREATE POLICY quiz_sessions_async_resolve_update ON public.quiz_sessions
  FOR UPDATE USING (
    deadline_at IS NOT NULL
    AND now() >= deadline_at
    AND status <> 'completed'
    AND EXISTS (
      SELECT 1 FROM public.quiz_participants p
      WHERE p.session_id = id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  ) WITH CHECK (
    deadline_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.quiz_participants p
      WHERE p.session_id = id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );
