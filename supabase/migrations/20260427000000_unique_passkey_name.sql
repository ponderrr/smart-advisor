-- =============================================================
-- UNIQUE PASSKEY NAMES PER USER
-- =============================================================
-- Mirrors auth.mfa_factors's per-user uniqueness on friendly_name.
-- Comparison is case-insensitive ("Test" and "test" collide), and
-- the index excludes NULL/blank names so users can keep multiple
-- unnamed passkeys without collisions.

-- Resolve any pre-existing duplicates so the index can be built. Keeps
-- the oldest row's name unchanged and appends " (2)", " (3)", ... to
-- the newer dupes (case-insensitive grouping).
WITH ranked AS (
  SELECT id,
         device_name,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, LOWER(device_name)
           ORDER BY created_at, id
         ) AS rn
  FROM public.user_passkeys
  WHERE device_name IS NOT NULL AND device_name <> ''
)
UPDATE public.user_passkeys p
   SET device_name = ranked.device_name || ' (' || ranked.rn || ')'
  FROM ranked
 WHERE p.id = ranked.id
   AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS user_passkeys_user_name_key
  ON public.user_passkeys (user_id, LOWER(device_name))
  WHERE device_name IS NOT NULL AND device_name <> '';
