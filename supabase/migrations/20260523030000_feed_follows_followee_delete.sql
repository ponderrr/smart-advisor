-- =============================================================
-- feed_follows: let the followee delete a follow tie too
-- =============================================================
-- The original DELETE policy only permitted the follower to remove
-- their own follow, which meant blocking severed only one direction
-- (blocker → blocked). The reverse row (blocked still follows the
-- blocker) was silently kept, leaving the blocker's posts visible in
-- the blocked user's feed via the friends scope.
--
-- Widening the delete policy to "follower OR followee" lets blockUser
-- cut both directions in a single OR-filtered DELETE, and also gives
-- users a normal "remove follower" capability — a follower row is by
-- definition shared state between the two profiles, so either party
-- being able to drop it matches user expectations.

DROP POLICY IF EXISTS "feed_follows_delete" ON public.feed_follows;

CREATE POLICY "feed_follows_delete" ON public.feed_follows
  FOR DELETE TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = followee_id);

COMMENT ON POLICY "feed_follows_delete" ON public.feed_follows IS
  'Either party of a follow tie can drop it. Lets blockUser sever both '
  'directions and gives followees a "remove follower" action.';
