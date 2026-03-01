# Smart Advisor — Setup Guide

## Prerequisites
- Node 18+
- Supabase CLI (`npm install -g supabase`)
- A Supabase account (free tier is sufficient)
- An Anthropic API key (Claude)

## 1. Clone & Install
```bash
git clone <your-repo-url>
cd smart-advisor-app
npm install
```

## 2. Create a New Supabase Project
1. Go to https://supabase.com and create a new project
2. Wait for it to provision (~2 minutes)
3. Go to Project Settings → API and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`

## 3. Configure Environment
```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## 4. Apply the Database Schema
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```
This applies `supabase/migrations/20250101000000-canonical-schema.sql`
which creates all tables, RLS policies, indexes, and triggers.

## 5. Deploy Edge Functions
```bash
supabase functions deploy anthropic-questions
supabase functions deploy anthropic-recommendations
supabase functions deploy tmdb-proxy
supabase functions deploy google-books-proxy
```

## 6. Set Edge Function Secrets
In the Supabase dashboard → Edge Functions → Manage secrets:
ANTHROPIC_API_KEY=sk-ant-...
TMDB_API_KEY=...          (optional)
GOOGLE_BOOKS_API_KEY=...  (optional)

## 7. Run Locally
```bash
npm run dev
# http://localhost:5173
```

## Deploying to Vercel

1. Push your repository to GitHub
2. Go to vercel.com → Add New Project → Import your repo
3. Vercel will auto-detect Vite — no framework config needed
4. Set these environment variables in Vercel dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
5. Deploy

Note: ANTHROPIC_API_KEY, TMDB_API_KEY, and GOOGLE_BOOKS_API_KEY are
Supabase Edge Function secrets. Set them in Supabase Dashboard →
Edge Functions → Manage secrets. Do not add them to Vercel.
