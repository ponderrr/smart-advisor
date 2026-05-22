# Localization — scope

## Where it stands

The localization machinery is fully wired:

- `lib/l10n/app_localizations*.dart` is generated from `.arb` files for
  10 languages (en, es, fr, de, pt, it, nl, ja, zh, ko).
- `localeProvider` + the Settings language picker + onboarding language
  step all work — changing the language *does* take effect.
- `MaterialApp` is configured with `supportedLocales` +
  `localizationsDelegates`.

The gap: **almost no screen actually uses it.** Only 3 files call
`AppLocalizations.of(context)` (the bottom-nav labels, essentially).
Every other string — headings, buttons, body copy, dialogs, banners,
empty states — is a hardcoded English literal. So switching the language
only re-labels the nav bar and Flutter's built-in widgets (date pickers,
text-selection menus); the app itself stays English.

This isn't a bug to fix — it's a feature that was never completed.

## What full localization requires

1. **String extraction.** Sweep every `lib/features/**` and `lib/ui/**`
   file and move each user-facing literal into `lib/l10n/app_en.arb`
   with a stable key. Estimate: 600–900 strings across ~60 files.
   - Plural / gendered / interpolated strings need ICU syntax in the
     `.arb` (e.g. `{count, plural, =1{1 pick} other{{count} picks}}`).
   - Content from the backend (recommendation text, AI questions) is
     already localized server-side via the user's locale — those stay
     as-is.

2. **Call-site rewrite.** Replace each literal with `l.theKey`, threading
   `AppLocalizations.of(context)` into every widget. Const constructors
   that currently hold literals have to become non-const.

3. **Translation.** Translate `app_en.arb` → the other 9 `.arb` files.
   This needs real translators or a vetted MT pass — ~700 strings × 9
   languages. Machine translation alone will read poorly for UI copy.

4. **QA per language.** Check layout overflow (German/Finnish run long),
   RTL is N/A here (no RTL languages shipped), and that date/number
   formatting uses `intl` against the active locale.

## Suggested approach

Do it as its own multi-build project, in this order:

1. Extract + rewrite **English-only** first (keys land, `app_en.arb`
   fills up, every screen reads from `l.*`). The app still shows English
   but is now *translatable*. This is the bulk of the engineering work
   and is verifiable on its own.
2. Then translate the `.arb` files language by language — each is purely
   additive and low-risk once step 1 is done.

Splitting it this way means the risky refactor (step 1) is one reviewable
effort, and translations (step 2) can land incrementally without
touching Dart code.
