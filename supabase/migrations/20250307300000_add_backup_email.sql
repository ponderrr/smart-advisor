-- Add backup_email column to profiles for alternative MFA verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_email TEXT;
