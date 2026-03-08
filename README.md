<div align="center">

<img src="public/svgs/smartadvisor/SmartAdvisor.svg" width="80" height="80" alt="Smart Advisor" />

# Smart Advisor

AI-powered movie & book recommendations tailored to who you actually are.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-16-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/supabase-postgres%20%2B%20edge%20functions-3ECF8E?logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/claude-sonnet%204-D97757?logo=anthropic&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-deployed-000000?logo=vercel&logoColor=white)

[Live Demo](https://smartadvisor.live) · [Setup Guide](docs/SETUP.md) · [Report Bug](https://github.com/ponderrr/smart-advisor/issues)

<img src="public/images/smart-advisor-preview.png" width="720" alt="Smart Advisor preview" />

</div>

## What It Is

Smart Advisor is a full-stack recommendation engine that builds a taste profile through a personality quiz — then uses Claude to generate one deeply-explained movie and one book pick that actually fit you. It is not a ranked list or a collaborative filter; every recommendation comes with a written explanation of why it matches your specific answers. The system uses different AI personas for users under 18 (warm, encouraging, PG-safe) and adults (direct, opinionated, willing to recommend dark and complex content).

## How It Works

1. **Sign up** — email + password or Google OAuth, with optional two-factor authentication (TOTP)
2. **Choose content** — movies, books, or both
3. **Pick quiz length** — 3 to 15 questions
4. **Take the quiz** — Claude generates personality-driven questions tailored to your age (scenario-based, preference comparisons, emotional responses)
5. **Get your pick** — Claude reads your full answer profile and returns one movie and/or one book with a personalized explanation, enriched with real posters and metadata from TMDB and Open Library
6. **Save and revisit** — every recommendation is persisted to your account with favorites and history

New users can also **try a demo quiz** without signing up — a 5-question survey that generates real-time recommendations from TMDB and Open Library.

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser (Next.js App Router)                 │
│  Auth → Quiz → Questions → Answers → Results → History       │
└──────────────────┬──────────────────────┬───────────────────┘
                   │ PKCE / JWT           │ JWT
                   ▼                      ▼
         ┌─────────────────┐   ┌──────────────────────┐
         │  Supabase Auth  │   │  Supabase Edge Fns   │
         │  (PKCE + MFA)   │   │                      │
         └────────┬────────┘   │  anthropic-questions  │
                  │            │  anthropic-recs        │
                  ▼            │  tmdb-proxy            │
         ┌─────────────────┐   └──────┬──────────┬────┘
         │Supabase Postgres│          │          │
         │                 │          ▼          ▼
         │  profiles       │   ┌────────────┐ ┌────────────┐
         │  recommendations│   │ Anthropic  │ │ TMDB /     │
         │  sessions       │   │ Claude API │ │ Open       │
         │  mfa_factors    │   └────────────┘ │ Library    │
         │  backup_codes   │                  └────────────┘
         │  (RLS enforced) │
         └─────────────────┘
```

## Feature Highlights

| Feature | Detail |
|---------|--------|
| **Age-gated AI personas** | Under-18 gets warm, encouraging picks. 18+ gets unfiltered recommendations including mature themes. |
| **Single sharp recommendation** | One movie. One book. Deeply explained. Not a ranked list. |
| **Real cover art** | TMDB and Open Library APIs fetch actual posters and covers. |
| **Two-factor authentication** | TOTP-based MFA with backup codes and backup email recovery. |
| **Device & session management** | View active sessions across devices, revoke individually or globally. |
| **Demo quiz** | Try the recommendation flow without creating an account. |
| **Full auth with PKCE** | Supabase Auth with email confirmation, Google OAuth, and PKCE flow. |
| **MFA-gated sensitive changes** | Profile, email, password, and account changes require MFA verification. |
| **Zero exposed secrets** | All API keys live in Supabase Edge Function secrets, never the frontend. |
| **Row Level Security** | Every DB query is scoped to the authenticated user at the Postgres level. |
| **Recommendation history** | All picks saved to account with favorites and filters. |

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 + React 19 + TypeScript | App Router, SSR-ready auth, file-based routing |
| Styling | Tailwind CSS + Radix UI | Utility-first CSS, accessible primitives |
| Auth | Supabase Auth (PKCE + MFA) | Email/password, Google OAuth, TOTP two-factor |
| Database | Supabase Postgres | RLS enforced at DB level, not app level |
| Edge Functions | Supabase Deno runtime | Server-side secrets, low latency, JWT verification |
| AI | Anthropic Claude Sonnet 4 | Better nuanced reasoning for taste-based recommendations |
| Movie data | TMDB API | Industry-standard movie metadata and poster images |
| Book data | Open Library API | Cover art and metadata for millions of titles (no API key required) |
| Hosting | Vercel | Zero-config Next.js deploys with automatic routing |

## Project Structure

```
smart-advisor/
├── src/app/                         # Next.js App Router pages
│   ├── layout.tsx                   # Root layout with metadata
│   ├── providers.tsx                # Client providers (Auth, Toaster)
│   ├── globals.css                  # Global styles (Tailwind + custom)
│   ├── page.tsx                     # Landing page (/)
│   ├── error.tsx                    # App-level error boundary
│   ├── loading.tsx                  # App-level loading skeleton
│   ├── not-found.tsx                # 404 page
│   ├── auth/
│   │   ├── page.tsx                 # Sign up / sign in / MFA challenge (/auth)
│   │   ├── reset-password/page.tsx  # Password reset flow
│   │   └── callback/route.ts       # OAuth + email verification handler
│   ├── demo/
│   │   ├── page.tsx                 # Unauthenticated demo quiz (/demo)
│   │   └── results/page.tsx         # Demo recommendation results
│   ├── settings/page.tsx            # Account settings (profile, security, content, integrations)
│   ├── account/
│   │   ├── security/page.tsx        # Security settings
│   │   └── mfa-setup/page.tsx       # MFA enrollment page
│   ├── content-selection/page.tsx   # Movie, book, or both
│   ├── question-count/page.tsx      # 3–15 questions
│   ├── questionnaire/page.tsx       # Dynamic AI-generated quiz
│   ├── results/page.tsx             # AI recommendation display + favorites
│   ├── dashboard/page.tsx           # User dashboard
│   ├── history/page.tsx             # Saved picks and favorites
│   └── api/
│       ├── open-library/route.ts    # Open Library search proxy
│       ├── hero-media/route.ts      # Hero section media fetcher
│       ├── demo-media/route.ts      # Demo quiz media API (Open Library + TMDB)
│       ├── demo-books/route.ts      # Demo quiz books API (Open Library)
│       └── account/                 # Account disable/delete endpoints
│
├── src/features/
│   ├── auth/
│   │   ├── components/              # AuthForm, MfaSetup, MfaManagement, SessionsManagement
│   │   ├── hooks/use-auth.tsx       # Auth context with MFA, backup codes, backup email
│   │   ├── services/
│   │   │   ├── auth-service.ts      # Auth, MFA, backup codes, backup email logic
│   │   │   └── session-management.ts # Device session tracking with deduplication
│   │   ├── types/user.ts            # User type definition
│   │   └── utils/                   # Validation, device parsing
│   ├── quiz/
│   │   ├── store/quiz-store.ts      # Zustand store for quiz flow state
│   │   ├── types/                   # Question, Answer interfaces
│   │   └── utils/                   # Fallback questions
│   ├── recommendations/
│   │   └── services/
│   │       ├── ai-service.ts        # Calls anthropic-questions + anthropic-recommendations
│   │       ├── enhanced-recommendations-service.ts  # Retry logic, TMDB/Open Library enrichment
│   │       ├── tmdb-service.ts      # TMDB proxy client
│   │       ├── open-library-service.ts  # Open Library client (replaces Google Books)
│   │       └── database-service.ts  # Recommendation CRUD + favorites
│   └── home/
│       ├── components/hero-section.tsx  # Animated hero with dynamic book/movie covers
│       └── data/homepage.ts         # Homepage content data
│
├── src/components/
│   ├── ui/                          # Base design system (shadcn — buttons, cards, inputs)
│   ├── enhanced/                    # Shimmer loaders, animated spinners, progress bars
│   ├── ErrorBoundary.tsx            # Global error boundary with recovery
│   └── theme-toggle.tsx             # Dark/light mode toggle
│
├── src/integrations/supabase/       # Supabase client + generated DB types
├── src/utils/                       # Env validation, localStorage helpers
│
├── supabase/
│   ├── functions/
│   │   ├── anthropic-questions/     # Claude generates personality quiz (JWT required)
│   │   ├── anthropic-recommendations/ # Claude generates recommendations (JWT required)
│   │   └── tmdb-proxy/              # Movie metadata + poster URLs (public)
│   └── migrations/
│       ├── 20250101000000_canonical_schema.sql      # Core tables, RLS, indexes
│       ├── 20250307100000_add_mfa_and_sessions.sql  # MFA factors + session tracking
│       ├── 20250307200000_add_backup_codes.sql      # Backup codes for MFA recovery
│       └── 20250307300000_add_backup_email.sql      # Backup email for recovery
│
├── public/
│   ├── images/                      # Photos, preview screenshots
│   └── svgs/smartadvisor/           # Brand wordmark + icon SVGs (light/dark)
├── docs/                            # Setup guide, auth documentation
└── .env.example                     # All required variables documented
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

> **Note:** `ANTHROPIC_API_KEY` and `TMDB_API_KEY` are Supabase Edge Function secrets. Set them in **Supabase Dashboard → Edge Functions → Manage Secrets**. They are never exposed to the browser. Open Library requires no API key.

## Security Model

All API keys (Anthropic, TMDB) are server-side only — they live in Supabase Edge Function secrets and are never bundled into the frontend. Row Level Security is enforced at the Postgres level: every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `profiles`, `recommendations`, `sessions`, `mfa_factors`, and `backup_codes` is scoped to `auth.uid()`, so even a compromised client cannot access another user's data. Authentication uses the PKCE flow with cookie-based sessions managed by `@supabase/ssr` and Next.js middleware. Two-factor authentication uses TOTP (RFC 6238) with SHA-256 hashed backup codes as a recovery mechanism. Sensitive account changes (profile, email, password, disable/delete) require MFA verification — either a TOTP code or completing MFA enrollment. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposed in the frontend is intentionally public; it can only access data that RLS policies explicitly allow for the authenticated user.

## Deployment

Vercel handles the frontend — it auto-detects Next.js and handles routing automatically via the App Router. Only two env vars go in Vercel: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Everything else (database, auth, edge functions, secrets) lives in Supabase. See **[docs/SETUP.md](docs/SETUP.md)** for step-by-step instructions.

## Roadmap

- [ ] Social sharing — let users share a recommendation card with friends
- [ ] More content types — podcasts, TV shows, video games
- [ ] Recommendation comparison — side-by-side view of past picks
- [ ] Rate limiting on edge functions to prevent abuse at scale
- [ ] Backup email verification via transactional email service

## License

[MIT](LICENSE)
