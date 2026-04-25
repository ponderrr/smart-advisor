-- =============================================================
-- PASSKEYS (WebAuthn credentials)
-- =============================================================
-- Stores per-user WebAuthn public keys so users can sign in
-- without a password. Registrations and authentications go
-- through Next.js API routes that validate attestation/assertion
-- with @simplewebauthn/server. Inserts use the service role key;
-- owners can read and delete their own credentials directly.

CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,  -- base64url
  public_key TEXT NOT NULL,            -- base64url
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[],
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id
  ON public.user_passkeys(user_id);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

-- Owners can list their passkeys (for the Settings card).
DROP POLICY IF EXISTS "Users can view their own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can view their own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can revoke (delete) their own passkeys.
DROP POLICY IF EXISTS "Users can delete their own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can delete their own passkeys"
  ON public.user_passkeys FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE happens through the API routes using the service
-- role, so no INSERT/UPDATE policies are defined for end users.

GRANT SELECT, DELETE ON public.user_passkeys TO authenticated;
