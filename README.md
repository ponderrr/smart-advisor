<div align="center">

<img src="public/smartadvisor.svg" width="80" height="80" alt="Smart Advisor" />

# Smart Advisor

AI-powered movie & book recommendations tailored to who you actually are.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/supabase-postgres%20%2B%20edge%20functions-3ECF8E?logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/claude-sonnet%204-D97757?logo=anthropic&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-deployed-000000?logo=vercel&logoColor=white)

[Live Demo](https://smartadvisor.live) · [Setup Guide](docs/SETUP.md) · [Report Bug](https://github.com/ponderrr/smart-advisor/issues)

<img src="public/smart-advisor-preview.png" width="720" alt="Smart Advisor preview" />

</div>

## What It Is

Smart Advisor is a full-stack recommendation engine that builds a taste profile through a personality quiz — then uses Claude to generate one deeply-explained movie and one book pick that actually fit you. It is not a ranked list or a collaborative filter; every recommendation comes with a written explanation of why it matches your specific answers. The system uses different AI personas for users under 18 (warm, encouraging, PG-safe) and adults (direct, opinionated, willing to recommend dark and complex content).

## How It Works

1. **Sign up** — email + password, Supabase Auth with PKCE flow
2. **Choose content** — movies, books, or both
3. **Pick quiz length** — 5, 10, or 15 questions
4. **Take the quiz** — Claude generates personality-driven questions tailored to your age (scenario-based, preference comparisons, emotional responses)
5. **Get your pick** — Claude reads your full answer profile and returns one movie and/or one book with a personalized explanation, enriched with real posters and metadata from TMDB and Google Books
6. **Save and revisit** — every recommendation is persisted to your account with favorites and history

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser (Next.js App Router)                 │
│  Auth → Quiz → Questions → Answers → Results → History       │
└──────────────────┬──────────────────────┬───────────────────┘
                   │ PKCE / JWT           │ JWT
                   ▼                      ▼
         ┌─────────────────┐   ┌──────────────────────┐
         │  Supabase Auth  │   │  Supabase Edge Fns   │
         │  (PKCE flow)    │   │                      │
         └────────┬────────┘   │  anthropic-questions  │
                  │            │  anthropic-recs        │
                  ▼            │  tmdb-proxy            │
         ┌─────────────────┐   │  google-books-proxy   │
         │Supabase Postgres│   └──────┬──────────┬────┘
         │                 │          │          │
         │  profiles       │          ▼          ▼
         │  recommendations│   ┌────────────┐ ┌────────────┐
         │  (RLS enforced) │   │ Anthropic  │ │ TMDB /     │
         └─────────────────┘   │ Claude API │ │ Google     │
                               └────────────┘ │ Books API  │
                                              └────────────┘
```

## Feature Highlights

| Feature | Detail |
|---------|--------|
| **Age-gated AI personas** | Under-18 gets warm, encouraging picks. 18+ gets unfiltered recommendations including mature themes. |
| **Single sharp recommendation** | One movie. One book. Deeply explained. Not a ranked list. |
| **Real cover art** | TMDB and Google Books APIs fetch actual posters and covers. |
| **Full auth with PKCE** | Supabase Auth with email confirmation and PKCE flow. |
| **Zero exposed secrets** | All API keys live in Supabase Edge Function secrets, never the frontend. |
| **Row Level Security** | Every DB query is scoped to the authenticated user at the Postgres level. |
| **Recommendation history** | All picks saved to account with favorites and filters. |

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 + React 18 + TypeScript | App Router, SSR-ready auth, file-based routing |
| Styling | Tailwind CSS + Radix UI | Utility-first CSS, accessible primitives |
| Auth | Supabase Auth (PKCE) | Magic links, JWT, RLS integration built-in |
| Database | Supabase Postgres | RLS enforced at DB level, not app level |
| Edge Functions | Supabase Deno runtime | Server-side secrets, low latency, JWT verification |
| AI | Anthropic Claude Sonnet 4 | Better nuanced reasoning for taste-based recommendations |
| Movie data | TMDB API | Industry-standard movie metadata and poster images |
| Book data | Google Books API | Cover art and metadata for millions of titles |
| Hosting | Vercel | Zero-config Next.js deploys with automatic routing |

## Project Structure

```
smart-advisor/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with metadata
│   ├── providers.tsx             # Client providers (QueryClient, Auth, Toaster)
│   ├── globals.css               # Global styles (Tailwind + custom)
│   ├── page.tsx                  # Landing page (/)
│   ├── not-found.tsx             # 404 page
│   ├── auth/
│   │   ├── page.tsx              # Sign up / sign in (/auth)
│   │   └── callback/route.ts    # OAuth + email verification handler
│   ├── content-selection/page.tsx    # Movie, book, or both
│   ├── question-count/page.tsx       # 5 / 10 / 15 questions
│   ├── questionnaire/page.tsx        # Dynamic AI-generated quiz
│   ├── results/page.tsx              # AI recommendation display + favorites
│   └── history/page.tsx              # Saved picks and favorites
│
├── public/
│   ├── smartadvisor.svg          # App favicon and logo
│   ├── smart-advisor-preview.png # og:image for social sharing
│   ├── sitemap.xml               # Search engine sitemap
│   ├── robots.txt                # Crawler permissions
│   └── llms.txt                  # AI crawler discovery
│
├── src/
│   ├── components/
│   │   ├── account/              # History filters, user stats card
│   │   ├── enhanced/             # Shimmer loaders, animated spinners, progress bars
│   │   ├── ui/                   # Base design system (shadcn — buttons, cards, inputs)
│   │   ├── ErrorBoundary.tsx     # Global error boundary with recovery
│   │   └── ExpandableText.tsx    # Truncated text with expand toggle
│   ├── hooks/
│   │   ├── useAuth.tsx           # Session management, profile fetch, auth state
│   │   └── use-mobile.tsx        # Responsive breakpoint detection
│   ├── lib/supabase/
│   │   ├── client.ts             # Browser Supabase client (@supabase/ssr)
│   │   └── server.ts             # Server Supabase client (cookie-based)
│   ├── store/
│   │   └── quizStore.ts          # Zustand store for quiz flow state
│   ├── services/
│   │   ├── ai.ts                 # Calls anthropic-questions + anthropic-recommendations
│   │   ├── auth.ts               # Supabase auth wrappers (sign up, sign in, profile)
│   │   ├── database.ts           # Recommendation CRUD + favorites
│   │   ├── enhancedRecommendations.ts  # Retry logic, TMDB/Books enrichment pipeline
│   │   ├── tmdb.ts               # TMDB proxy client
│   │   └── googleBooks.ts        # Google Books proxy client
│   ├── types/                    # Shared TypeScript interfaces
│   │   ├── Answer.ts
│   │   ├── Question.ts
│   │   ├── Recommendation.ts
│   │   └── User.ts
│   ├── integrations/supabase/    # Supabase client + generated DB types
│   └── utils/
│       ├── envValidation.ts      # Validates required env vars on startup
│       └── localStorage.ts       # Safe localStorage wrapper with JSON helpers
│
├── middleware.ts                  # Next.js auth middleware (replaces ProtectedRoute)
│
├── supabase/
│   ├── functions/
│   │   ├── anthropic-questions/  # Claude generates personality quiz (JWT required)
│   │   ├── anthropic-recommendations/ # Claude generates recommendations (JWT required)
│   │   ├── tmdb-proxy/           # Movie metadata + poster URLs (public)
│   │   └── google-books-proxy/   # Book metadata + cover URLs (public)
│   ├── migrations/
│   │   └── 20250101000000_canonical_schema.sql  # Tables, RLS, indexes, triggers
│   └── config.toml               # Function config (JWT, entrypoints)
│
├── docs/
│   └── SETUP.md                  # Full local + Vercel + Supabase setup guide
└── .env.example                  # All required variables documented
```

## Quick Start

```bash
git clone https://github.com/ponderrr/smart-advisor
cd smart-advisor
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
# http://localhost:3000
```

For the full guide — including Supabase project setup, database migrations, edge function deployment, and production secrets — see **[docs/SETUP.md](docs/SETUP.md)**.

## Environment Variables

| Variable | Where to set | Required | Description |
|----------|-------------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Yes | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Supabase secrets | Yes | Powers all AI question and recommendation generation |
| `TMDB_API_KEY` | Supabase secrets | No | Movie posters and metadata. Falls back to placeholder if absent |
| `GOOGLE_BOOKS_API_KEY` | Supabase secrets | No | Book covers and metadata. Falls back to placeholder if absent |

> **Note:** `ANTHROPIC_API_KEY`, `TMDB_API_KEY`, and `GOOGLE_BOOKS_API_KEY` are Supabase Edge Function secrets. Set them in **Supabase Dashboard → Edge Functions → Manage Secrets**. They are never exposed to the browser.

## Security Model

All API keys (Anthropic, TMDB, Google Books) are server-side only — they live in Supabase Edge Function secrets and are never bundled into the frontend. Row Level Security is enforced at the Postgres level: every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `profiles` and `recommendations` is scoped to `auth.uid()`, so even a compromised client cannot access another user's data. Authentication uses the PKCE flow with cookie-based sessions managed by `@supabase/ssr` and Next.js middleware. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposed in the frontend is intentionally public; it can only access data that RLS policies explicitly allow for the authenticated user.

## Deployment

Vercel handles the frontend — it auto-detects Next.js and handles routing automatically via the App Router. Only two env vars go in Vercel: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Everything else (database, auth, edge functions, secrets) lives in Supabase. See **[docs/SETUP.md](docs/SETUP.md)** for step-by-step instructions.

## Roadmap

- [ ] Social sharing — let users share a recommendation card with friends
- [ ] More content types — podcasts, TV shows, video games
- [ ] Recommendation comparison — side-by-side view of past picks
- [ ] Rate limiting on edge functions to prevent abuse at scale

## License

[MIT](LICENSE)
