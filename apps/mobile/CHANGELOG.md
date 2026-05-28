# Smart Advisor mobile — changelog

Per-prerelease notes for the `feat/flutter-app` Flutter port. Each entry
mirrors the GitHub prerelease at
`https://github.com/ponderrr/smart-advisor/releases/tag/mobile-v1.0.0-test.N`.
The in-app **Account → Help → What's new** screen surfaces an abridged
bullet version of these notes; this file is the long-form developer
record (write here first when shipping a new prerelease, then condense
into `changelog_screen.dart`).

## test.25 — 2026-05-28 (versionCode 3025 / 4025)

A polish drop — the auth screens get a more modern look, Wrapped stops
being a wall of text, the scanner gets pinch-to-zoom + a fix for the
"grant camera access" lockup, and a handful of haptic touches land on
the FAQ + What's new surfaces.

- **Sign-in / sign-up screen redesign.** The old layout was a small
  `BrandCard` floating on a blank scaffold, which read tight and
  forms-on-forms. The new layout drops the wrapping card, gives the
  form room to breathe, uses a 32pt heading, and swaps the
  "label-above-box" inputs for outlined floating-label fields
  (`BrandTextField`, exported from `ui.dart`). The biometric option
  collapses to a compact icon button alongside the primary "Sign in"
  CTA so the primary action stays the visual anchor. Both screens
  carry autofill hints so the system password manager works on iOS
  and Android.
- **Pinch-to-zoom on the barcode scanner.** Wraps `MobileScanner` in
  a scale gesture and drives `controller.setZoomScale(0..1)` directly.
  Useful on phones whose telephoto isn't exposed as a physically
  separate `LENS_FACING_BACK` camera (the common Pixel / iPhone case):
  pinch in to reach a far-away spine without relying on a third lens
  the OS doesn't surface. Stacks cleanly with the existing lens-cycle
  button — that picks between physically distinct lenses, this then
  digital-zooms within the active lens.
- **Wrapped: cover art everywhere.** The story used to be a wall of
  large-text slides which read flat compared to the rest of the app.
  Each slide now leans on the data's poster URLs: the intro fades in a
  low-opacity backdrop of every poster you got this period, the Mix
  slide shows three mini-posters above the counts (one per medium),
  the On Repeat slide rolls a row of your top creator's works, the
  Standout slide hero-renders the poster of the title itself, and the
  share card carries a row of thumbs above the headline. Missing
  covers fall back to a tinted gradient so a thin month doesn't punch
  holes in the layout.
- **Seasonal gating for the Wrapped entries.** Year-in-review only
  surfaces in December and January (the Spotify-Wrapped pattern); the
  Month-in-review tile only surfaces over the wrap-up days of one
  month and the first day of the next. Outside those windows the
  Notifications hub no longer shows the tile, which keeps the surface
  honest — a mid-year tile that summarises 4 months of activity is
  an anticlimax for everyone. The `/wrapped` and `/wrapped/month`
  routes themselves remain reachable for QA and replay.
- **Lens-switch debounce on the scanner.** Rapid taps on the lens-cycle
  / camera-flip buttons used to overlap `switchCamera` calls, which on
  Android left CameraX's Camera2 session in a state the plugin
  surfaced as "Camera unavailable / grant permission" — and the
  Camera2 session wouldn't drop until well after the controller was
  disposed, so the error persisted on screen re-entry. A single
  `_runSwitch` helper now latches an in-flight flag and ignores
  presses while a transition is running.
- **Selection haptic on FAQ + What's new expansions.** Tapping an
  `ExpansionTile` in either surface fires `Haptics.selection()` on
  expand and collapse. Matches the rest of the app's tap-feel.

Note on the "telephoto" lens: `mobile_scanner` enumerates only
physically separate back cameras via CameraX's `CameraSelector`. Phones
that expose telephoto as digital zoom on the main lens (most modern
Pixels, the bulk of iPhones) cycle between normal + wide only. The new
pinch gesture is the answer for that hardware reality — there is no
plugin or API toggle to "force-expose" a virtual zoom lens.

## test.24 — 2026-05-24 (versionCode 3024 / 4024)

Two focused fixes on top of test.23.

- **Cycle through normal / wide / zoom lenses on the barcode
  scanner.** mobile_scanner 7.2.0 exposes `ToggleLensType` which
  walks the available back lenses on the current facing. The
  scanner now queries `getSupportedLenses()` on mount and shows a
  lens-cycle button between the torch and camera-flip controls,
  but only when the phone has 2+ back lenses to cycle. Useful on
  phones whose default lens focuses poorly close-up — swap to the
  normal lens (or zoom) until the ISBN snaps to focus. The icon
  + tooltip update from the controller's `ValueNotifier` so the
  current lens is always accurate.
- **Tapping a &ldquo;Someone&rdquo; comment author no longer kicks you
  to &ldquo;This post isn't available&rdquo;.** When a comment's author
  embed came back null (e.g. a profile row with name=null), the
  row carried authorId='' and the tap pushed `/feed/u/` —
  go_router normalised that to `/feed/u`, which the broader
  `feed/:id` route caught first with id='u', dropping the user
  on PostDetailScreen's not-found state. `openUserProfile` now
  early-returns when profileId is empty, so the tap is a no-op
  instead of a misroute. (Root cause of the null embed is
  separate — likely a profile row with name=null or a migration
  not deployed — tracked.)

## test.23 — 2026-05-24 (versionCode 3023 / 4023)

A polish + correctness batch — no new surfaces, just tighter
feedback on the existing ones.

- **Block confirm dialog on a user profile.** The Block button on
  someone's profile page used to fire on a single tap, which made
  it too easy to wipe their posts out of your feed by accident.
  It now opens the same Cancel / Block confirm as the post-overflow
  Block flow, with a haptic on confirm. Unblock stays one-tap
  (matches Settings → Blocked) and now also fires a haptic on tap.
- **More haptic feedback.** Overflow-menu picks — feed
  block_menu, library row menu, comment-sort menu — were all
  silent between the tap and the action firing. Now each fires a
  selection tick so the menu choice has weight.
- **Scan moved inside Import.** The Library header had three pills
  side-by-side (Scan / Import / Clear) which squeezed the
  &ldquo;Logged & saved&rdquo; heading out of alignment on phone widths.
  Scan now lives inside the Import screen as a &ldquo;One at a time&rdquo;
  section above the bulk CSV section — same single hub for
  adding books from outside the app.
- **Barcode scanner: torch + camera flip.** A top-right control
  strip in the scanner toggles the flashlight and switches
  between front / back cameras. Driven off MobileScannerController's
  own ValueNotifier so the torch icon stays accurate if the OS
  auto-disables it (low battery, thermal, etc).
- **&ldquo;You&rsquo;re offline&rdquo; banner + auto-refresh on reconnect.**
  Drops the last-good-snapshot OfflineCache from feed / library /
  history — the cache was confusing because users couldn't tell
  which rows were live vs. frozen at the moment of the last
  successful fetch. A new connectivity_plus-backed banner sits at
  the top of the AppShell and shows an amber &ldquo;You're offline&rdquo;
  strip when there's no network transport up; on the offline→online
  edge the feed auto-invalidates so it refreshes without a manual
  pull.
- **Color-coded report-status pills.** Admin Reports filter pills
  (Open / Resolved / All) now carry the status semantic: Open=amber
  (matches the Open status badge below), Resolved=emerald (matches
  the Reviewed badge), All=slate. Previously every option used the
  same violet active state.
- **Group-quiz summary in plain language.** The confirm step on a
  hosted quiz read &ldquo;async · 24 hours&rdquo; / &ldquo;live · together now&rdquo;,
  which both scanned as jargon. Now &ldquo;Reply within 24 hours&rdquo; and
  &ldquo;Together now&rdquo; — the user already picked the mode via the
  &ldquo;Together now / By a deadline&rdquo; segmented above, so the summary
  just describes the window in plain English.

New runtime dep: `connectivity_plus` for the offline detection.
No migrations.

## test.22 — 2026-05-24 (versionCode 3022 / 4022)

Six features sitting on top of test.21. The cohesive thread is
**closing loops around things the feed already does**: pushing a
recent friend pick out to the home screen, surfacing what changed
in-app so testers don't have to read the GitHub release, sending a
single pick to a single friend, surviving a cold launch on a flaky
network, and rails for real push when FCM lands.

- **Send a pick to a friend (lightweight DM).** A new "Send to a
  friend" entry sits in the post overflow menu (above "Copy link").
  Tap it to open a draggable bottom sheet listing everyone you
  follow, with an optional one-liner above. Tap a row to send — the
  sheet auto-closes with a confirm banner. Recipient sees it in the
  notifications inbox (new `pick_sent` kind, with a per-kind muted
  toggle under Settings → Notifications → Activity) and as a
  foreground local-notification if the app is open. Multi-select is
  intentionally NOT supported in v1 — a pick blasted to 50 people
  isn't a recommendation, it's spam.
- **Offline feed cache.** The feed now wraps `fetchFeed` in the same
  `OfflineCache` that already backs Library + History: a successful
  fetch refreshes the `feed` snapshot, and a failure (cold launch on
  the subway, flaky network) serves the last good list back instead
  of dropping you on a hard error state. Caveat: `ageHours` is
  frozen at snapshot time, so a re-served list shows slightly-stale
  relative timestamps until the next successful fetch.
- **Scan a book barcode to add it to your library.** New "Scan" pill
  in the Library header (next to "Import") opens a full-screen
  camera that watches for ISBN-13 barcodes via `mobile_scanner` —
  only 978/979 prefixes are accepted so you can't accidentally add a
  cereal box. On detection: Open Library lookup (title, author,
  year, cover) → confirm sheet → inserts to your library with
  `wishlist` status. Camera permission declared on both platforms;
  iOS works through `mobile_scanner`'s AVFoundation backend with no
  extra Xcode target.
- **Android home-screen widget.** A 2×1 cell with a violet/indigo
  brand gradient showing the title + "r/<community> · <author>" of
  the most recent post not authored by you (falling back to the very
  latest post on the cold-start edge where every post is yours). Tap
  launches the app. Refreshes are driven by the existing 60s feed
  poll — no separate background job. iOS deferred: needs a separate
  Xcode Widget Extension target (Swift), tracked as a follow-up.
- **In-app changelog screen.** Account → Help → What's new now
  renders an abridged bullet version of this very file. The
  most-recent build expands by default so the latest changes are
  visible without a tap. Not auto-popped on upgrade — the
  prerelease cadence is fast enough that an upgrade modal every
  couple of hours would get noisy.
- **device_tokens registry + foreground push hybrid.** New
  `device_tokens` table (transport-agnostic — FCM today, APNs / Web
  Push tomorrow) with owner-only RLS. New `core/push_service.dart`
  exposes register/unregister methods that upsert tokens; the token
  source is pluggable so wiring `firebase_messaging` later is
  mechanical. Until then, the existing 60s feed poller in
  `feed_screen.dart` now also pulls `feed_notifications` and surfaces
  newly-arrived ones via a local notification — a stopgap for "I
  see the notification while the app is alive", not real
  wake-from-closed.

Migrations: `20260524010000_device_tokens.sql`,
`20260524020000_feed_pick_sends.sql`. Run `supabase db push`
against the live project before installing test.22 so the new
tables + `pick_sent` enum value exist.

## test.21 — 2026-05-23 (versionCode 3021 / 4021)

Six tier-1 social features that lean on data the feed already has,
plus two platform-native unlocks.

- **Emoji reactions on posts and comments.** New `feed_reactions` table
  (one emoji per user per target — `❤️ 🔥 😂 😢 🤔 👏`, server-enforced
  via CHECK). Reaction bar renders under every post body and comment.
  Tap an emoji to add, tap your own to clear, tap a different one to
  replace.
- **@mention links.** `@handle` anywhere in a comment / post body
  renders as a tappable accent-colored span. Tap resolves the username
  via `profiles_public` and pushes the user profile.
- **Global search.** New search icon next to the bell →
  `/feed/search`. Debounced ilike across people (name OR @username)
  and picks (title OR body); blocked users filtered out.
- **"People you may know."** New rail above Suggested on Add friends.
  Ranks friends-of-friends by mutual-overlap count with a "N mutual"
  line. Hidden when you have no follows yet so the cold-start surface
  is unchanged.
- **App icon long-press shortcuts.** Take a quiz / Open feed / Group
  quiz via `quick_actions`.
- **Inbound share-target.** Share a URL or text from another app and
  pick Smart Advisor in the system share sheet — composer opens with
  the payload in the body. Android only on this build; iOS needs a
  separate Share Extension target (Xcode follow-up).

Build fix: every plugin's Android subproject is now pinned to JVM 17 in
`android/build.gradle.kts` so newer plugins (e.g. `receive_sharing_intent`
ships a Kotlin 21 build against Java 1.8) don't blow up
`assembleRelease` with "Inconsistent JVM-target compatibility."

Migration: `supabase/migrations/20260524000000_feed_reactions.sql`.

## test.20 — 2026-05-23 (versionCode 3020 / 4020)

**Notification settings split into sub-screens.** The flat list of
toggles on test.19 became three tiles:

- **Activity** — six per-kind server toggles (follow / friend_post /
  comment_on_post / reply_to_comment / post_upvote / comment_upvote),
  each writes to a per-device muted-kinds set that's also applied to
  the bell badge and inbox so they all stay in sync.
- **Reminders** — the existing weekly / group-quiz expiring /
  in-progress local schedules.
- **Your data** — inbox + Year/Month in Review shortcuts.

Hub tile subtitles show "All on" / "X of N on" / "All off" at a glance
so you can see what's enabled without drilling in.

## test.19 — 2026-05-23 (versionCode 3019 / 4019)

- **Social notifications.** New `feed_notifications` table +
  AFTER-INSERT triggers cover six kinds: new followers, friend posts,
  comments on your posts, replies to your comments, post upvotes,
  comment upvotes. Notifications screen merges these with the local
  inbox into one timeline; feed-header bell badge counts both.
- **Block + report polish.** Block now opens an "Are you sure?"
  confirm; blocked-people list shows avatars + a search field once
  there are six or more entries; blocking refuses any follow attempt
  either side initiates and filters them out of suggestions.
- **Reports moderation (admin).** Status field
  (`open` / `reviewed` / `dismissed`) with admin-only RLS, filter
  chips, per-row Reviewed / Dismiss / Reopen buttons. The public
  "Reports you've filed" screen shows the same status badge.
- **Faster post detail.** Opening a post from a deep link or the
  admin "Open post" jump no longer waits for the entire feed to load;
  voting inside a post no longer flickers to the loader either.
- **Biometric sign-in scoped per account.** Biometric on this device
  is now bound to the user_id that enrolled it; a different account
  signing in auto-disables it and clears the stored session.
- **"Finish setting up" nudge.** One-time-every-few-days bottom sheet
  for users who skipped onboarding without personalising their
  profile.
- **Friends list.** A Friends tile (Following / Followers counts) in
  Settings → Feed → People; the friends screen gets the same lazy
  search as Blocked.

Migrations: `20260523020000_feed_reports_status.sql`,
`20260523030000_feed_follows_followee_delete.sql`,
`20260523040000_feed_notifications.sql`.

## test.18 — 2026-05-23 (versionCode 3018 / 4018)

- **MFA challenge actually shows now.** Root cause: `AuthService.signIn`
  trusted `getAuthenticatorAssuranceLevel()` exclusively, but the JWT's
  AAL hint sometimes lags right after `signInWithPassword`, silently
  bypassing 2FA. Fix: safety-net `listFactors()` call — if any TOTP
  factor is verified, force the challenge regardless of the AAL claim.
- **Sign-up back arrow** now routes to `/intro` (Get Started) instead
  of `/auth` so the destination is consistent regardless of how the
  user reached sign-up.
- **Smart AI nudge** placement: only surfaces when the user has
  actually run out of things to look at (empty feed or after the last
  post), not as a permanent banner.
- **In-app admin reports moderation.** New `profiles.is_admin` column
  (default FALSE, column-level UPDATE revoked from authenticated/anon
  so clients can't elevate themselves). Additive
  `feed_reports_select_admin` RLS. New `ReportsScreen` at
  `/account/reports`, surfaced as a Moderation → Reports tile shown
  only when `profile.isAdmin == true`.

Migrations: `20260523000000_feed_reports_readable_view.sql`,
`20260523010000_admin_reports.sql`.

## test.17 — 2026-05-23 (versionCode 3017 / 4017)

- **Profile cross-account hydration (the "Someone" bug).** The
  `profiles_select` RLS policy is owner-only, so embeds like
  `author:profiles(...)` returned NULL for any row other than your
  own — cascading into "Someone" display names, broken `isOwn` checks
  (hid Edit/Delete on your own posts when viewed from another
  account), and a "post isn't available" deep-link fallback. Fix: a
  new `profiles_public` view (`security_invoker = false`) exposes only
  safe columns (id, name, username, avatar_url, bio, interests, tags,
  library_public, created_at). All feed embeds switched.
- **Profile isn't available state.** UserProfileScreen returns a
  dedicated screen when the loaded profile is null (deleted account,
  bad link).
- **Dedicated report screen.** New `/feed/report` route with reason
  radio list + optional details textarea — replaces the inline
  confirm dialog. Compatible with existing moderation tooling.
- **Notifications screen** split into three independent toggles
  (weekly quiz reminder / group-quiz expiring / finish what you
  started) with migration from the legacy bundled toggle so existing
  installs keep their setting.
- **l10n.** Contact, Appearance, Notifications, Blocked people, Filed
  reports — five screens wired through `AppLocalizations`. All ten
  ARBs updated.

Migration: `supabase/migrations/20260522040000_profiles_public_view.sql`.
