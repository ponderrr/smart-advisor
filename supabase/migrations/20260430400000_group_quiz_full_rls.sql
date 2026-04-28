-- Fills in the missing RLS pieces needed for a fully-working group quiz:
--   - UPDATE on quiz_answers so .upsert() can take the ON CONFLICT branch
--     (the original migration only granted INSERT, which silently 403'd
--     whenever Supabase's upsert hit an existing row).
--   - DELETE on quiz_answers so the host can clear answers when restarting.
--   - Expand UPDATE on quiz_participants so the host can reset every
--     participant's answers_submitted_at during a restart, not just their
--     own row.

DROP POLICY IF EXISTS quiz_answers_update ON public.quiz_answers;
CREATE POLICY quiz_answers_update ON public.quiz_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_participants p
      WHERE p.id = participant_id
        AND p.session_id = session_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_participants p
      WHERE p.id = participant_id
        AND p.session_id = session_id
    )
  );

DROP POLICY IF EXISTS quiz_answers_host_delete ON public.quiz_answers;
CREATE POLICY quiz_answers_host_delete ON public.quiz_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = session_id AND s.host_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quiz_participants_self_update ON public.quiz_participants;
DROP POLICY IF EXISTS quiz_participants_update ON public.quiz_participants;
CREATE POLICY quiz_participants_update ON public.quiz_participants
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = session_id AND s.host_user_id = auth.uid()
    )
  );
