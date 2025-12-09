<div align="center">

# Smart Advisor
AI-personalized movie & book recommendations with Supabase auth, OpenAI reasoning, and live enrichment.

![Build](https://img.shields.io/badge/Build-Vite_5-8B5CF6?style=for-the-badge&logo=vite)
![Version](https://img.shields.io/badge/Version-1.0.0-00D9FF?style=for-the-badge&logo=semver)
![Frontend](https://img.shields.io/badge/React-18.3-00D9FF?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Supabase-Edge_Functions-3FCF8E?style=for-the-badge&logo=supabase)
![AI](https://img.shields.io/badge/OpenAI-GPT--4o_mini-8B5CF6?style=for-the-badge&logo=openai)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)

</div>

<br/>

## About
Smart Advisor builds age-aware questionnaires, invokes OpenAI for intent understanding, enriches results with TMDB/Google Books metadata, and stores user-specific histories in Supabase with Row Level Security. It is production-minded: JWT-protected Edge Functions, no client-side key exposure, and resilient fallbacks for third-party APIs.

- **What it does**: Auth → personalized questions → AI recommendations → metadata enrichment → saved history/favorites.
- **Who it’s for**: Consumer apps, media platforms, and teams needing secure AI-backed recommendations.
- **Why it matters**: Strong security (RLS/JWT), typed contracts, resilient enrichment, and DX-focused frontend.

## Key Features
- **AI Questionnaire Orchestration** — Generates 3–15 dynamic, age-safe questions via Supabase Edge + GPT-4o-mini.
- **Hybrid Recommendation Engine** — Combines OpenAI reasoning with TMDB/Google Books enrichment while preserving AI explanations.
- **Secure-by-Default Auth** — Supabase PKCE auth, persisted sessions, RLS on profiles/recommendations, verified JWT on protected functions.
- **Resilient Edge Functions** — Deno functions with strict validation, CORS hardening, backoff, and safe defaults when providers fail.
- **History & Favorites** — Persistent recommendation history, filters, favorite toggles, and stats with indexed queries.
- **UX for Retention** — Structured loading states, retry flows, cached sessions, confirm-before-regenerate safeguards.
- **Performance-aware Frontend** — React 18 + Vite, React Query caching, guarded retries, and lazy UI composition.
- **Observability Hooks** — Structured console logging in Edge Functions; global error boundary and env validation in the SPA.

## Tech Stack
**Languages**  
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript) ![Deno](https://img.shields.io/badge/Deno-Edge-000000?style=for-the-badge&logo=deno) ![SQL](https://img.shields.io/badge/PostgreSQL-SQL-336791?style=for-the-badge&logo=postgresql) ![CSS](https://img.shields.io/badge/Tailwind-3.x-38BDF8?style=for-the-badge&logo=tailwindcss)

**Frontend**  
![React](https://img.shields.io/badge/React-18-00D9FF?style=for-the-badge&logo=react) ![Vite](https://img.shields.io/badge/Vite-5-8B5CF6?style=for-the-badge&logo=vite) ![React_Query](https://img.shields.io/badge/React_Query-5-FF4154?style=for-the-badge&logo=reactquery) ![Radix_UI](https://img.shields.io/badge/Radix_UI/shadcn-FF006E?style=for-the-badge)

**Backend / Services**  
![Supabase](https://img.shields.io/badge/Supabase-DB/Auth/Storage-3FCF8E?style=for-the-badge&logo=supabase) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o_mini-8B5CF6?style=for-the-badge&logo=openai) ![TMDB](https://img.shields.io/badge/TMDB-API-01B4E4?style=for-the-badge&logo=themoviedatabase) ![Google_Books](https://img.shields.io/badge/Google_Books-API-34A853?style=for-the-badge&logo=google)

**DevOps / Infra**  
![Vercel](https://img.shields.io/badge/Vercel-Hosting-000000?style=for-the-badge&logo=vercel) ![Supabase_Edge](https://img.shields.io/badge/Edge_Functions-Deno-000000?style=for-the-badge&logo=deno) ![Postgres](https://img.shields.io/badge/Postgres-RLS-4169E1?style=for-the-badge&logo=postgresql) ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint)

**Observability / Security**  
![RLS](https://img.shields.io/badge/Security-Row_Level_Security-FF006E?style=for-the-badge) ![JWT](https://img.shields.io/badge/Auth-JWT_PKCE-00D9FF?style=for-the-badge) ![CORS](https://img.shields.io/badge/API-CORS_Hardening-8B5CF6?style=for-the-badge) ![Validation](https://img.shields.io/badge/Validation-Zod/Runtime-FF006E?style=for-the-badge)

## Architecture
- **SPA Frontend**: React 18 + Vite, React Query for server state, `ProtectedRoute`, global error boundary, env validation on boot.
- **Auth & Data**: Supabase Auth (PKCE) + Postgres with RLS on `profiles` and `recommendations`; indexed columns for performance.
- **Edge Functions**: Deno-based Supabase functions for GPT prompts, TMDB proxy, Google Books proxy; JWT required on AI endpoints.
- **AI Orchestration**: GPT-4o-mini for question + recommendation JSON; exponential backoff on the frontend and defaults on functions.
- **Enrichment**: TMDB/Google Books proxies return safe defaults when keys are absent to avoid UX failures.
- **Deployment**: Vercel for SPA, Supabase for DB/Auth/Edge. Env validation protects against missing critical keys.

### System Architecture
```mermaid
flowchart LR
  UI["React SPA (Vite)"] -->|JWT| Edge["Supabase Edge Functions"]
  UI -->|Supabase JS| Auth["Supabase Auth"]
  Edge -->|SQL/RPC| DB["Postgres + RLS"]
  Edge -->|GPT-4o-mini| OpenAI["OpenAI API"]
  Edge -->|Title/Author| TMDB["TMDB API"]
  Edge -->|Title/Author| GBooks["Google Books API"]
  DB <--> Realtime["Supabase Realtime"]
```

### Component Diagram (Frontend)
```mermaid
flowchart TB
  App["App.tsx"] --> Router["React Router"]
  Router --> Pages["Content/Questionnaire/Results/History"]
  Pages --> Services["openai.ts / enhancedRecommendations.ts"]
  Services --> SupabaseJS["Supabase Client"]
  Services --> Query["React Query"]
  Query --> UI["shadcn/Radix UI Components"]
```

### API Lifecycle (Questions → Recommendations)
```mermaid
sequenceDiagram
  participant UI as SPA
  participant EdgeQ as "edge: openai-questions"
  participant EdgeR as "edge: openai-recommendations"
  participant OpenAI as "OpenAI API"
  participant DB as "Supabase DB"

  UI->>EdgeQ: POST /functions/v1/openai-questions (JWT, {contentType, userAge, count})
  EdgeQ->>OpenAI: Prompt for N questions (JSON mode)
  OpenAI-->>EdgeQ: Questions JSON
  EdgeQ-->>UI: {questions[]}

  UI->>EdgeR: POST /functions/v1/openai-recommendations (JWT, answers, age)
  EdgeR->>OpenAI: Prompt for movie/book JSON
  OpenAI-->>EdgeR: Recommendation JSON
  EdgeR-->>UI: {movieRecommendation?, bookRecommendation?}
  UI->>DB: saveRecommendation (with enrichment)
  DB-->>UI: persisted rows
```

### Deployment Diagram
```mermaid
flowchart LR
  Dev["Developer"] --> Vercel["Vercel Deploy"]
  Dev --> SupaCLI["Supabase CLI: migrations/functions"]
  Vercel --> CDN["Edge CDN"]
  CDN --> Browser["Users"]
  Browser --> SupabaseURL["Supabase Project"]
  SupabaseURL --> Functions["Edge Functions (Deno)"]
  SupabaseURL --> Postgres["Postgres + RLS"]
```

## Documentation & Deep Examples
**Generate questions (frontend → Edge)**
```ts
import { generateQuestionsWithRetry } from "@/services/openai";

const questions = await generateQuestionsWithRetry("movie", 28, 5);
// -> [{ id, text, content_type, user_age_range }, ...]
```

**Generate and enrich recommendations**
```ts
const recs = await enhancedRecommendationsService.retryRecommendation(
  { answers, contentType: "both", userAge: user.age },
  user.id
);
// AI JSON -> TMDB/Google Books enrichment -> persisted to Supabase
```

**Supabase client bootstrap**
```ts
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, flowType: "pkce" } }
);
```

**Edge Function contracts**
- `POST /functions/v1/openai-questions` (JWT) → `{questions[]}`  
  Body: `{ contentType: "movie"|"book"|"both", userAge: 13-120, questionCount: 3-15 }`
- `POST /functions/v1/openai-recommendations` (JWT) → `{ movieRecommendation?, bookRecommendation? }`
- `GET /functions/v1/tmdb-proxy?title=Inception` (public) → `{ poster, year, rating, description }` with safe defaults
- `GET /functions/v1/google-books-proxy?title=Dune&author=Herbert` (public) → `{ cover, year, rating, description }` with safe defaults

**Environment configuration**
| Name | Scope | Description |
| --- | --- | --- |
| VITE_SUPABASE_URL | frontend | Supabase project URL (required) |
| VITE_SUPABASE_ANON_KEY | frontend | Supabase anon key (required) |
| SUPABASE_URL | edge | Supabase project URL |
| SUPABASE_ANON_KEY | edge | Supabase anon key |
| OPENAI_API_KEY | edge | GPT-4o-mini access |
| TMDB_API_KEY | edge | Movie enrichment (optional; defaults exist) |
| GOOGLE_BOOKS_API_KEY | edge | Book enrichment (optional; defaults exist) |

**Data flow (frontend)**
```mermaid
flowchart LR
  Select["Content Selection"] --> QCount["Question Count"]
  QCount --> Quiz["AI Questions"]
  Quiz --> Answers["User Answers"]
  Answers --> EdgeCall["Edge: Recommendations"]
  EdgeCall --> Enrich["TMDB/Google Books"]
  Enrich --> Save["Supabase.recommendations"]
  Save --> History["History & Favorites"]
```

## Getting Started
**Prerequisites**
- Node 18+ (or Bun)
- Supabase project (DB/Auth) + CLI for migrations
- OpenAI API key; optional TMDB/Google Books keys
- Vercel (or static host) for SPA deploy

**Install**
```bash
npm install
# or
bun install
```

**Environment**
```bash
cp .env.example .env.local  # create and populate required keys
# Required (frontend): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# Required (edge): SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
```

**Local development**
```bash
npm run dev
# http://localhost:5173
```

**Supabase migrations (via CLI)**
```bash
supabase db reset            # applies /supabase/migrations/*
supabase functions serve     # local edge testing
```

**Production build**
```bash
npm run build
npm run preview
```

**Deploy**
- SPA: `npm run build` → deploy `dist/` to Vercel (see `vercel.json`).
- Edge Functions: `supabase functions deploy openai-questions openai-recommendations tmdb-proxy google-books-proxy`.
- Env: set all required keys in Vercel + Supabase dashboard.

## API Documentation
| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/functions/v1/openai-questions` | POST | Bearer (Supabase session) | Generate N personalized questions |
| `/functions/v1/openai-recommendations` | POST | Bearer (Supabase session) | Generate AI recommendations JSON |
| `/functions/v1/tmdb-proxy` | GET | Public | TMDB search with safe fallbacks |
| `/functions/v1/google-books-proxy` | GET | Public | Google Books lookup with safe fallbacks |

**Error handling**
- 400 with `{ error, timestamp }` on validation failures.
- Default media payloads (200) returned when TMDB/Google Books keys are absent to avoid CORS/UX breaks.

**Rate limits**
- Provider limits (OpenAI/TMDB/Google Books) + Supabase org limits. Add gateway-level rate limiting if exposed publicly.

## Project Structure
```
/src
├── pages/                  # Auth, questionnaire, results, history
├── services/               # openai, enrichment, tmdb, googleBooks, database, auth
├── components/             # UI (shadcn/radix), layout, error boundary, protected route
├── hooks/                  # Auth hook, toasts, mobile detection
├── integrations/supabase/  # Supabase client + typed DB
├── utils/                  # Env validation, local storage, helpers
└── types/                  # Shared TypeScript types (DB, domain models)
/supabase
├── functions/              # Deno edge functions (OpenAI, TMDB, Books)
└── migrations/             # Postgres schema, RLS, constraints, indexes
dist/                       # Production build output
```

