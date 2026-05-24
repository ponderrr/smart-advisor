-- =============================================================
-- feed_notifications + triggers
-- =============================================================
-- A per-user notification feed for the social side of the app —
-- new followers, comments on your posts, replies to your comments,
-- posts from people you follow, and upvotes on your content. Rows
-- are inserted by AFTER-INSERT triggers on the source tables so the
-- mobile client only needs to read this one table (polled on app
-- resume; we deliberately don't subscribe via Realtime — see the
-- "No Supabase Realtime" project memory).
--
-- Each trigger skips notifying the actor about their own action and
-- respects the block graph in both directions (no notification if
-- either side has blocked the other).

CREATE TYPE public.feed_notification_kind AS ENUM (
  'follow',
  'comment_on_post',
  'reply_to_comment',
  'friend_post',
  'post_upvote',
  'comment_upvote'
);

CREATE TABLE public.feed_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  kind public.feed_notification_kind NOT NULL,
  post_id UUID REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.feed_comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX feed_notifications_user_created_idx
  ON public.feed_notifications (user_id, created_at DESC);
CREATE INDEX feed_notifications_user_unread_idx
  ON public.feed_notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.feed_notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can read their own notifications and mark them read.
-- Inserts come from SECURITY DEFINER trigger functions; clients can't
-- insert directly. Deletes are allowed so the inbox "Clear" works.
CREATE POLICY "feed_notifications_select_own" ON public.feed_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feed_notifications_update_own" ON public.feed_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_notifications_delete_own" ON public.feed_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Helpers ────────────────────────────────────────────────────────

-- Returns TRUE when there is a block between `a` and `b` in either
-- direction — used everywhere we'd otherwise notify across a block.
CREATE OR REPLACE FUNCTION public._feed_either_blocks(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.feed_blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  );
$$;

-- Single insert path so trigger bodies stay readable. Skips self
-- notifications (no point telling you what you just did) and any
-- pair where a block exists either way.
CREATE OR REPLACE FUNCTION public._feed_notify(
  recipient UUID,
  actor UUID,
  kind public.feed_notification_kind,
  post UUID,
  comment UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF recipient IS NULL OR recipient = actor THEN
    RETURN;
  END IF;
  IF actor IS NOT NULL AND public._feed_either_blocks(recipient, actor) THEN
    RETURN;
  END IF;
  INSERT INTO public.feed_notifications
    (user_id, actor_id, kind, post_id, comment_id)
  VALUES (recipient, actor, kind, post, comment);
END;
$$;

-- ── Triggers ───────────────────────────────────────────────────────

-- New follower → notify followee.
CREATE OR REPLACE FUNCTION public._feed_notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  PERFORM public._feed_notify(
    NEW.followee_id, NEW.follower_id, 'follow', NULL, NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_follow
  AFTER INSERT ON public.feed_follows
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_follow();

-- Comment on a post or reply to another comment → notify post owner,
-- and (when parent_id is set) the parent comment's author too.
CREATE OR REPLACE FUNCTION public._feed_notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  post_owner UUID;
  parent_author UUID;
BEGIN
  SELECT user_id INTO post_owner FROM public.feed_posts WHERE id = NEW.post_id;
  PERFORM public._feed_notify(
    post_owner, NEW.user_id, 'comment_on_post', NEW.post_id, NEW.id);

  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_author
      FROM public.feed_comments WHERE id = NEW.parent_id;
    -- Skip the second notification when the parent author is the
    -- post owner (we just notified them once already).
    IF parent_author IS NOT NULL AND parent_author <> post_owner THEN
      PERFORM public._feed_notify(
        parent_author, NEW.user_id, 'reply_to_comment',
        NEW.post_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_comment
  AFTER INSERT ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_comment();

-- New post → notify each follower of the author.
CREATE OR REPLACE FUNCTION public._feed_notify_on_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_notifications
    (user_id, actor_id, kind, post_id, comment_id)
  SELECT f.follower_id, NEW.user_id, 'friend_post', NEW.id, NULL
  FROM public.feed_follows f
  WHERE f.followee_id = NEW.user_id
    AND NOT public._feed_either_blocks(f.follower_id, NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_post
  AFTER INSERT ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_post();

-- Upvote on a post → notify the post owner. Downvotes are ignored
-- (no point pinging someone about a downvote). On vote flips we'd
-- get a duplicate row; the client groups by (kind, post_id) in the
-- inbox to keep the visual list tidy.
CREATE OR REPLACE FUNCTION public._feed_notify_on_post_vote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  post_owner UUID;
BEGIN
  IF NEW.value <= 0 THEN RETURN NEW; END IF;
  SELECT user_id INTO post_owner FROM public.feed_posts WHERE id = NEW.post_id;
  PERFORM public._feed_notify(
    post_owner, NEW.user_id, 'post_upvote', NEW.post_id, NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_post_vote
  AFTER INSERT ON public.feed_post_votes
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_post_vote();

-- Upvote on a comment → notify the comment owner. Same rules as posts.
CREATE OR REPLACE FUNCTION public._feed_notify_on_comment_vote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  comment_owner UUID;
  parent_post UUID;
BEGIN
  IF NEW.value <= 0 THEN RETURN NEW; END IF;
  SELECT user_id, post_id INTO comment_owner, parent_post
    FROM public.feed_comments WHERE id = NEW.comment_id;
  PERFORM public._feed_notify(
    comment_owner, NEW.user_id, 'comment_upvote',
    parent_post, NEW.comment_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_notify_on_comment_vote
  AFTER INSERT ON public.feed_comment_votes
  FOR EACH ROW EXECUTE FUNCTION public._feed_notify_on_comment_vote();

COMMENT ON TABLE public.feed_notifications IS
  'Per-user notification feed for social events. Populated by AFTER '
  'INSERT triggers on feed_follows / feed_comments / feed_posts / '
  'feed_post_votes / feed_comment_votes. Polled by the mobile client; '
  'no Realtime subscription.';
