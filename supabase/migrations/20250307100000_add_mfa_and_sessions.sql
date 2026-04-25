-- =============================================================
-- MFA & SESSION MANAGEMENT TABLES
-- =============================================================

-- -----------------------------------------------
-- mfa_factors table - Track MFA enrollments
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.mfa_factors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  factor_type TEXT NOT NULL DEFAULT 'totp' CHECK (factor_type IN ('totp', 'phone')),
  factor_id TEXT UNIQUE NOT NULL,  -- Supabase factor ID
  is_verified BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- Soft delete for audit trail
);

-- -----------------------------------------------
-- sessions table - Track active sessions/devices
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,  -- Supabase session ID
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,  -- e.g., "Chrome on Windows 10"
  device_type TEXT,  -- e.g., "desktop", "mobile", "tablet"
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  is_current_device BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ  -- NULL = active, otherwise = revoked
);

-- -----------------------------------------------
-- Row Level Security
-- -----------------------------------------------
ALTER TABLE public.mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- MFA factors policies
CREATE POLICY "mfa_factors_select" ON public.mfa_factors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mfa_factors_insert" ON public.mfa_factors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mfa_factors_update" ON public.mfa_factors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mfa_factors_delete" ON public.mfa_factors FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------
-- Indexes (including partial unique indexes)
-- -----------------------------------------------
CREATE UNIQUE INDEX unique_verified_factor_per_user ON public.mfa_factors(user_id, factor_type) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX active_session_uniqueness ON public.sessions(user_id, session_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_mfa_factors_user_id ON public.mfa_factors(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mfa_factors_factor_type ON public.mfa_factors(factor_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX idx_sessions_revoked_at ON public.sessions(revoked_at);
CREATE INDEX idx_sessions_last_activity ON public.sessions(last_activity);

-- -----------------------------------------------
-- Update profiles table to track MFA status
-- -----------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_enabled ON public.profiles(mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);
