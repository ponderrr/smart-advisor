-- ============================================================
-- feed_pick_sends: "send this pick to a friend"
-- ============================================================
-- Lightweight DM-style surface that reuses the existing post graph
-- — sender + recipient + post + optional one-liner. Not a chat
-- thread (no replies, no thread continuation) — that's a much
-- bigger feature that can come later.
--
-- Recipient surfaces the send via the existing feed_notifications
-- inbox: an AFTER-INSERT trigger fires `_feed_notify` with a new
-- 'pick_sent' kind so the bell badge, mute toggles, and inbox card
-- all work without any new client-side plumbing.
--
-- Same pick can be sent to the same person multiple times (e.g.
-- "have you read this yet??" follow-up) — we deliberately do NOT
-- add a UNIQUE (sender, recipient, post). The notification list
-- will show each send as its own row.

-- Add 'pick_sent' to the enum first so the trigger body can use it.
-- ALTER TYPE ADD VALUE has to be its own statement; can't be in a
-- block with the table that references it.
ALTER TYPE public.feed_notification_kind ADD VALUE IF NOT EXISTS 'pick_sent';

CREATE TABLE IF NOT EXISTS public.feed_pick_sends (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  post_id      UUID        NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  message      TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS feed_pick_sends_recipient_idx
  ON public.feed_pick_sends (recipient_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS feed_pick_sends_sender_idx
  ON public.feed_pick_sends (sender_id, sent_at DESC);

ALTER TABLE public.feed_pick_sends ENABLE ROW LEVEL SECURITY;

-- Sender + recipient can both SELECT; sender INSERTs; either can
-- DELETE (sender can unsend, recipient can dismiss / archive).
CREATE POLICY "feed_pick_sends_select" ON public.feed_pick_sends
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "feed_pick_sends_insert" ON public.feed_pick_sends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "feed_pick_sends_delete" ON public.feed_pick_sends
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Notify the recipient via the existing feed_notifications inbox.
-- Reuses the shared _feed_notify helper, which skips the row if the
-- recipient has blocked the sender (or vice versa).
CREATE OR REPLACE FUNCTION public._feed_notify_on_pick_send()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  PERFORM public._feed_notify(
    NEW.recipient_id, NEW.sender_id, 'pick_sent', NEW.post_id, NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_pick_send
  AFTER INSERT ON public.feed_pick_sends
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_pick_send();
