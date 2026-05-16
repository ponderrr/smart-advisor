# Smart Advisor — Mobile (Flutter)

Flutter client (iOS + Android) for Smart Advisor. Shares the existing Supabase
backend + Edge Functions with the web app — no shared client code (web is TS,
this is Dart); parity is enforced via the Supabase/Edge-Function contract.

## Requirements

- Flutter **3.38+** (Apple requires Xcode 26 / iOS 26 SDK for App Store builds).
- iOS release builds need macOS + Xcode 26. Android can be built from Linux.

## Run

One-time (or whenever Supabase creds change) — generate the git-ignored
`.env` from the repo-root `.env.local` (client-public values only):

```bash
./tool/sync-env.sh
```

Then a bare run just works (config is loaded from the bundled `.env` at startup):

```bash
flutter run -d linux        # or any device
```

Alternatives that override the `.env` (CI, scripted): `./tool/run.sh` (sources
`.env.local` and passes `--dart-define`), or pass
`--dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...` yourself.
Resolution order: `--dart-define` → bundled `.env`.

## Structure

```
lib/
  core/config/env.dart         # compile-time config (dart-define), fail-fast
  core/router/app_router.dart  # go_router (Riverpod provider; routes per phase)
  features/<feature>/...       # feature-first, mirrors web src/features/*
  main.dart                    # Supabase.initialize + ProviderScope + router
```

State: Riverpod · Nav: go_router · Backend: supabase_flutter ·
iOS 26 Liquid Glass chrome: adaptive_platform_ui (scoped to shell, Phase 3).

See the repo-root plan (Phases 0–7) for build order.
