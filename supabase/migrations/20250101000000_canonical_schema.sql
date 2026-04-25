-- =============================================================
-- SMART ADVISOR — CANONICAL SCHEMA
-- Single source of truth. All previous migrations are replaced.
-- =============================================================

-- -----------------------------------------------
-- profiles table
-- -----------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- recommendations table — FLAT schema (no JSONB)
-- -----------------------------------------------
CREATE TABLE public.recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'book')),
  content_type TEXT NOT NULL DEFAULT 'both' CHECK (content_type IN ('movie', 'book', 'both')),
  title TEXT NOT NULL,
  description TEXT,
  explanation TEXT,
  poster_url TEXT,
  genre TEXT,
  rating DECIMAL(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  is_favorited BOOLEAN DEFAULT FALSE,
  director TEXT,
  author TEXT,
  year INTEGER CHECK (year IS NULL OR (year >= 1900 AND year <= 2100)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- Row Level Security
-- -----------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- recommendations policies
CREATE POLICY "recommendations_select" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recommendations_insert" ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommendations_update" ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recommendations_delete" ON public.recommendations FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------
-- Indexes
-- -----------------------------------------------
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at);
CREATE INDEX idx_recommendations_type ON public.recommendations(type);
CREATE INDEX idx_recommendations_is_favorited ON public.recommendations(is_favorited);
CREATE INDEX idx_recommendations_content_type ON public.recommendations(content_type);

-- -----------------------------------------------
-- Auto-create profile on signup
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 25),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTE: The validate_recommendation_trigger is intentionally excluded.
-- It required JSONB columns (movie_recommendation, book_recommendation)
-- that do not exist in the flat schema the application uses, causing
-- all recommendation inserts to fail.
