-- Bumps the upper bound on question_count from 12 to 15. The original CHECK
-- was inline so Postgres named it `quiz_sessions_question_count_check`; we
-- drop and re-create with the wider range.

ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_question_count_check;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_question_count_check
  CHECK (question_count BETWEEN 3 AND 15);
