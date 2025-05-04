import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and public anon key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to direct values if environment variables not available
// You should replace these with your actual Supabase project URL and anon key
const fallbackURL = 'https://your-project-id.supabase.co';
const fallbackKey = 'your-public-anon-key';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  SUPABASE_URL || fallbackURL, 
  SUPABASE_ANON_KEY || fallbackKey
);