-- Group Quiz: let the host cap how many people can join the lobby. Default
-- 8 keeps the prior behavior loose (existing sessions weren't capped) while
-- giving new hosts a sensible bound. Range 2-20 mirrors the host UI.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 8
    CHECK (max_participants BETWEEN 2 AND 20);
