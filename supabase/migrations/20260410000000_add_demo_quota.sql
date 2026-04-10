-- Per-IP-per-day rate limiting for the unauthenticated demo recommendations route.
-- ip_hash is a SHA-256 of (client_ip || DEMO_RATE_LIMIT_SALT) so we never store raw IPs.

CREATE TABLE IF NOT EXISTS public.demo_quota (
  ip_hash    TEXT        NOT NULL,
  day        DATE        NOT NULL,
  run_count  INTEGER     NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, day)
);

-- Server-side only (called via service role from /api/demo-recommendations).
ALTER TABLE public.demo_quota ENABLE ROW LEVEL SECURITY;

-- Atomic increment + return new count, so concurrent requests can't double-spend the quota.
CREATE OR REPLACE FUNCTION public.increment_demo_quota(p_ip_hash TEXT, p_day DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.demo_quota (ip_hash, day, run_count, updated_at)
  VALUES (p_ip_hash, p_day, 1, now())
  ON CONFLICT (ip_hash, day) DO UPDATE
    SET run_count  = public.demo_quota.run_count + 1,
        updated_at = now()
  RETURNING run_count INTO new_count;

  RETURN new_count;
END;
$$;

-- Lock the function to the service role; no one else needs it.
REVOKE EXECUTE ON FUNCTION public.increment_demo_quota(TEXT, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_demo_quota(TEXT, DATE) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_demo_quota(TEXT, DATE) TO service_role;
