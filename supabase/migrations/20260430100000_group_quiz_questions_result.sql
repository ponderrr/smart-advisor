-- Stores the question set generated for a group quiz session and the
-- synthesized recommendation once the host triggers the result. Both are
-- JSON blobs to avoid coupling to the moving question/recommendation
-- shape — the client controls what gets read back.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS questions JSONB,
  ADD COLUMN IF NOT EXISTS result JSONB;
