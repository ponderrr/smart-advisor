-- Group Quiz: lets a host create a shareable session that other people
-- (account or guest) can join with a 6-char code. Each participant answers
-- the same question set; once the host closes the session, the AI synthesis
-- pass produces a single recommendation that fits everyone.

-- ─── Tables ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'in_progress', 'completed', 'cancelled')),
  content_type TEXT NOT NULL DEFAULT 'both'
    CHECK (content_type IN ('movie', 'book', 'both')),
  question_count INTEGER NOT NULL DEFAULT 5
    CHECK (question_count BETWEEN 3 AND 12),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS quiz_sessions_code_idx ON public.quiz_sessions (code);
CREATE INDEX IF NOT EXISTS quiz_sessions_host_idx ON public.quiz_sessions (host_user_id);
CREATE INDEX IF NOT EXISTS quiz_sessions_expires_idx ON public.quiz_sessions (expires_at);

CREATE TABLE IF NOT EXISTS public.quiz_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  -- Nullable so guests without an account can still play.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answers_submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS quiz_participants_session_idx
  ON public.quiz_participants (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_participants_unique_user_per_session
  ON public.quiz_participants (session_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.quiz_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS quiz_answers_unique_per_question
  ON public.quiz_answers (participant_id, question_index);
CREATE INDEX IF NOT EXISTS quiz_answers_session_idx
  ON public.quiz_answers (session_id);

-- ─── Helper: short shareable code generator ──────────────────────────

CREATE OR REPLACE FUNCTION public.generate_quiz_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  -- Crockford-ish alphabet without easily-confused characters (no 0/O/1/I/L).
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Sessions are readable by anyone (you need to be able to look up by code
-- before joining), but only the host can mutate them.
DROP POLICY IF EXISTS quiz_sessions_select ON public.quiz_sessions;
CREATE POLICY quiz_sessions_select ON public.quiz_sessions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS quiz_sessions_insert ON public.quiz_sessions;
CREATE POLICY quiz_sessions_insert ON public.quiz_sessions
  FOR INSERT WITH CHECK (
    host_user_id = auth.uid()
  );

DROP POLICY IF EXISTS quiz_sessions_host_update ON public.quiz_sessions;
CREATE POLICY quiz_sessions_host_update ON public.quiz_sessions
  FOR UPDATE USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());

DROP POLICY IF EXISTS quiz_sessions_host_delete ON public.quiz_sessions;
CREATE POLICY quiz_sessions_host_delete ON public.quiz_sessions
  FOR DELETE USING (host_user_id = auth.uid());

-- Participants: anyone can read; anyone (incl. anon) can join an active
-- lobby session; users can only delete/update themselves.
DROP POLICY IF EXISTS quiz_participants_select ON public.quiz_participants;
CREATE POLICY quiz_participants_select ON public.quiz_participants
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS quiz_participants_insert ON public.quiz_participants;
CREATE POLICY quiz_participants_insert ON public.quiz_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = session_id AND s.status IN ('lobby', 'in_progress')
    )
  );

DROP POLICY IF EXISTS quiz_participants_self_update ON public.quiz_participants;
CREATE POLICY quiz_participants_self_update ON public.quiz_participants
  FOR UPDATE USING (
    user_id = auth.uid() OR (user_id IS NULL)
  );

DROP POLICY IF EXISTS quiz_participants_self_delete ON public.quiz_participants;
CREATE POLICY quiz_participants_self_delete ON public.quiz_participants
  FOR DELETE USING (
    user_id = auth.uid() OR (user_id IS NULL)
  );

-- Answers: anyone in the session can read everyone's answers (needed for
-- the AI synthesis step); participants can only insert their own.
DROP POLICY IF EXISTS quiz_answers_select ON public.quiz_answers;
CREATE POLICY quiz_answers_select ON public.quiz_answers
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS quiz_answers_insert ON public.quiz_answers;
CREATE POLICY quiz_answers_insert ON public.quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_participants p
      WHERE p.id = participant_id
        AND p.session_id = session_id
    )
  );

-- ─── Realtime ───────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;
