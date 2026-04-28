-- Postgres logical replication only sends primary keys on DELETE by default,
-- which means Supabase Realtime can't evaluate RLS against the deleted row
-- and silently drops the event. Setting REPLICA IDENTITY FULL forces the WAL
-- to include the entire row, so DELETE events flow through to subscribers
-- (host needs this to see participants leave in real time).

ALTER TABLE public.quiz_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_participants REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_answers REPLICA IDENTITY FULL;
