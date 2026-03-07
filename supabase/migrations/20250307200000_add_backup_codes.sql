-- Backup codes table for MFA recovery
CREATE TABLE IF NOT EXISTS public.backup_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON public.backup_codes(user_id);

ALTER TABLE public.backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backup codes"
  ON public.backup_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backup codes"
  ON public.backup_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backup codes"
  ON public.backup_codes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backup codes"
  ON public.backup_codes FOR DELETE
  USING (auth.uid() = user_id);
