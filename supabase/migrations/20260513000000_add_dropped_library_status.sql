-- =============================================================
-- Add `dropped` status to user_library
-- =============================================================
-- A user starting something and giving up is a strong negative
-- taste signal — distinct from a low rating on a finished item.
-- Extend the existing status CHECK to allow 'dropped'.

ALTER TABLE public.user_library
  DROP CONSTRAINT IF EXISTS user_library_status_check;

ALTER TABLE public.user_library
  ADD CONSTRAINT user_library_status_check
  CHECK (status IN ('finished', 'in_progress', 'wishlist', 'dropped'));
