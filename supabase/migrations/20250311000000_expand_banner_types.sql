-- Expand banner types to cover all use cases
-- Drop and recreate the check constraint with new types
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_type_check;
ALTER TABLE public.banners ADD CONSTRAINT banners_type_check
  CHECK (type IN (
    'info',
    'warning',
    'error',
    'success',
    'maintenance',
    'feature',
    'announcement',
    'urgent',
    'countdown',
    'promotion',
    'update',
    'tip'
  ));

-- Fix visibility constraint to match frontend ('homepage-only' instead of 'homepage')
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_visibility_check;
ALTER TABLE public.banners ADD CONSTRAINT banners_visibility_check
  CHECK (visibility IN ('site-wide', 'homepage-only'));

-- Add countdown_target column for countdown banners
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMPTZ;
