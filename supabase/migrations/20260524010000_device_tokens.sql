-- ============================================================
-- device_tokens: per-device push token registry
-- ============================================================
-- Transport-agnostic: holds FCM tokens today (when Firebase is
-- wired), APNs tokens for iOS, or anything else later (Web
-- Push, OneSignal, etc.) — the `platform` column discriminates.
-- A user can have many devices; a single token is unique across
-- the table (it's the platform's own identifier).
--
-- The server-side sender (an Edge Function / cron job that reads
-- feed_notifications inserts and posts to FCM HTTP v1) queries
-- this table by user_id to fan out, then ON CONFLICT-bumps
-- updated_at to keep the row fresh. RLS lets each user manage
-- only their own rows; the sender uses the service role.

CREATE TABLE IF NOT EXISTS public.device_tokens (
  token       TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  platform    TEXT        NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_idx
  ON public.device_tokens (user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Owner-only across the board. The server-side sender bypasses
-- RLS via the service role and reads every row.
CREATE POLICY "device_tokens_select" ON public.device_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "device_tokens_insert" ON public.device_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "device_tokens_update" ON public.device_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "device_tokens_delete" ON public.device_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
