-- Create banners table for admin-configurable site banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('maintenance', 'feature', 'announcement', 'info')),
  visibility TEXT NOT NULL DEFAULT 'site-wide' CHECK (visibility IN ('site-wide', 'homepage')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Everyone can read active banners
CREATE POLICY "Anyone can read active banners"
  ON public.banners
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

-- Enable realtime for banners
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_banners_updated_at();
