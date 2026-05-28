import 'package:flutter/material.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../ui/ui.dart';
import 'settings_helpers.dart';

/// Mobile-specific FAQ — deliberately distinct from the web /#faq
/// because mobile has its own UX (taps + sheets, biometric unlock,
/// push notifications, inbound share-target) and a different feature
/// set. Update this list whenever a feature lands that users are
/// likely to ask about.
///
/// English-only for now; mobile localization is a dedicated follow-up
/// (see docs/LOCALIZATION_SCOPE.md).
class _FaqItem {
  const _FaqItem(this.category, this.question, this.answer);
  final String category;
  final String question;
  final String answer;
}

const _faqItems = <_FaqItem>[
  // ── Getting started ────────────────────────────────────────────────
  _FaqItem(
    'getting-started',
    'How do I sign up?',
    'Tap Sign up on the auth screen, enter your name, email, age and a password (minimum 8 characters). Verify your email via the link we send, then run through the short onboarding to set your display name and language.',
  ),
  _FaqItem(
    'getting-started',
    'Why do I need to verify my email?',
    'Verification confirms the address is yours and protects the account from someone else signing up with it. Check your spam folder if the email does not arrive within a minute or two.',
  ),
  _FaqItem(
    'getting-started',
    'Can I sign in with my fingerprint or Face ID?',
    'Yes. Once you are signed in, open Account -> Security and turn on Biometric app-lock. The next time you open the app it will require your device biometric (fingerprint, Face ID, or device PIN) before unlocking.',
  ),

  // ── How it works ───────────────────────────────────────────────────
  _FaqItem(
    'how-it-works',
    'How does Smart Advisor personalize recommendations?',
    'Your quiz answers (mood, pacing, genres) plus your library reactions feed an AI model that picks titles tuned to your taste. Posters, summaries, trailers and 30-second previews come from TMDB (movies), Open Library (books) and Deezer (music).',
  ),
  _FaqItem(
    'how-it-works',
    'How does the quiz work?',
    'Choose a content type (movie / book / music / mix), then a question count between 3 and 15. Each question morphs in on the same screen — no page reloads. "Surprise me" skips the questionnaire and picks one for you immediately.',
  ),
  _FaqItem(
    'how-it-works',
    'Can I get movies, books, and music in one session?',
    'Yes. Pick "Mix" during content selection and you will get one of each in the same result set, all enriched with their respective poster / cover art / preview.',
  ),
  _FaqItem(
    'how-it-works',
    'What if my recommendations feel off?',
    'Log a quick reaction on titles in your library — a thumbs-up tells the AI "more like this", a thumbs-down nudges it away. You can also adjust content focus, mood, and tone in Account -> Recommendations to retune the baseline.',
  ),

  // ── Feed ───────────────────────────────────────────────────────────
  _FaqItem(
    'feed',
    'How does the feed work?',
    'A Reddit-style stream of picks people share. You can scope it to Friends, Discover, or Group, filter by community (Movies / Books / Music), and sort by Trending, New, or Top — each setting persists across launches.',
  ),
  _FaqItem(
    'feed',
    'How do I share a pick?',
    'Tap the floating "Share a pick" button. Pick a community, a status (Finished / Rated / Recommending), type the title and the cover art is looked up automatically as you type — TMDB for movies, Open Library for books, Deezer for music. Add an optional note and post.',
  ),
  _FaqItem(
    'feed',
    'Can I edit or delete my posts and comments?',
    'Yes — both. On your own posts, the overflow menu has Edit and Delete. On your own comments, an Edit button sits next to Reply (a "· edited" tag appears on the byline once you have changed the body). Posts and comments you do not own only expose Report.',
  ),
  _FaqItem(
    'feed',
    'How do up and down votes work?',
    'Each post and each comment has up / down arrows in its rail. Tap once to vote, tap again to clear. The number you see is the canonical server score across every voter; your own state lights the arrow violet (up) or rose (down).',
  ),
  _FaqItem(
    'feed',
    'Will I see new posts in real time?',
    'The feed polls in the background every minute and surfaces a "N new posts" pill at the top when fresh posts land upstream. Pull-to-refresh works from the top; once you scroll deep, a floating Refresh pill appears so you can refetch without scrolling back up. Coming back to the app from the background also refetches automatically.',
  ),
  _FaqItem(
    'feed',
    'How do I follow people, block someone, or report content?',
    'Tap a name to open their profile and use Follow. The overflow on any post or comment lets you Report it or Block the author — blocked authors disappear from your feed entirely. Manage the list under Account -> Blocked people, and your filed reports under Account -> Filed reports.',
  ),

  // ── Group quiz ─────────────────────────────────────────────────────
  _FaqItem(
    'group-quiz',
    'What is Group Quiz?',
    'A shared quiz session — host creates a code, everyone joins on their own device, answers the same questions, and the AI synthesises one recommendation that fits the whole room. Works best with 2-4 players.',
  ),
  _FaqItem(
    'group-quiz',
    'Do I need an account to join?',
    'No. Joining requires only the code and a display name. Hosting needs an account so the group\'s pick can be saved to your library and streaks counted.',
  ),
  _FaqItem(
    'group-quiz',
    'Does the lobby update live?',
    'Yes — joins, submissions, and the host\'s start signal stream over Supabase Realtime. On Android, a Live Activity keeps the session state visible from the lockscreen / status bar while you are backgrounded.',
  ),
  _FaqItem(
    'group-quiz',
    'Can a session run asynchronously?',
    'Yes. The host can set a deadline instead of a fixed start; everyone answers when they can. We schedule a local notification close to the deadline so nobody forgets.',
  ),

  // ── Library & history ──────────────────────────────────────────────
  _FaqItem(
    'library',
    'What is the difference between library and history?',
    'History is every recommendation the AI has generated for you. Library is what you have actually engaged with — Finished, In progress, Wishlist, or Dropped — with an optional thumbs rating and a one-line reaction. Log items from any results screen or from the history detail sheet.',
  ),
  _FaqItem(
    'library',
    'Can I import my watchlist from Letterboxd or Goodreads?',
    'Yes. Account -> Library has an Import option that accepts a Letterboxd or Goodreads CSV export; matching rows are added to your library as Wishlist (or Finished when the export includes a watched date).',
  ),
  _FaqItem(
    'library',
    'How does my library shape future recommendations?',
    'Your most recent rated entries are sent alongside your quiz answers as a taste signal — thumbs-up nudges the AI toward "more like this", thumbs-down toward less. Reactions you write are read verbatim, so a one-liner like "too slow" carries real weight on the next pick.',
  ),

  // ── Wrapped ────────────────────────────────────────────────────────
  _FaqItem(
    'wrapped',
    'What is Year in Review?',
    'A Spotify-Wrapped-style summary of your year: top genre, longest streak, peak month, most-picked creator, format mix, and standout titles. It surfaces on the feed during December and January and lives at /wrapped any time. Each card can be captured as an image and shared.',
  ),

  // ── Account & privacy ──────────────────────────────────────────────
  _FaqItem(
    'account',
    'How do I enable two-factor authentication?',
    'Account -> Security -> Two-factor & devices. Scan the QR with an authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code to confirm. Save the backup codes we generate — they unlock the account if you lose your phone.',
  ),
  _FaqItem(
    'account',
    'Why does my web session show up under Devices?',
    'The Devices list spans every client signed in to your account — web, mobile, or both. Each device writes a row when it signs in (or rotates its token). "This device" is determined by matching the live access token, and the icon comes from the device type (laptop / phone / tablet).',
  ),
  _FaqItem(
    'account',
    'Will the app notify me when something happens?',
    'Account -> Notifications turns on a weekly reminder to keep your taste graph fresh. Group quiz deadline reminders are scheduled automatically when you join an async session. Push notifications for feed / library events are on the roadmap.',
  ),
  _FaqItem(
    'account',
    'Can I delete or disable my account?',
    'Yes — both options are in Account -> Danger zone. Disable signs you out and locks the account until you sign in again to re-enable it. Delete permanently removes your data and is irreversible. Both require re-verifying your password or 2FA.',
  ),
  _FaqItem(
    'account',
    'How is my data handled?',
    'Stored in Supabase with row-level security: only you (and our service role, server-side) can read your rows. We only use your preferences and library to generate recommendations. We do not share your data with third parties.',
  ),
  _FaqItem(
    'account',
    'Is Smart Advisor open source?',
    'Yes — the full source for the web app, mobile app, and Edge Functions lives on GitHub. See Account -> Contact us for the repo link.',
  ),
];

const _categoryLabels = <String, String>{
  'getting-started': 'Getting started',
  'how-it-works': 'How it works',
  'feed': 'Feed',
  'group-quiz': 'Group quiz',
  'library': 'Library & history',
  'wrapped': 'Year in review',
  'account': 'Account & privacy',
};

const _categoryOrder = <String>[
  'getting-started',
  'how-it-works',
  'feed',
  'group-quiz',
  'library',
  'wrapped',
  'account',
];

/// FAQ screen — categorised expandable list. Static content, no
/// network. Linked from Settings -> Help.
class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final byCategory = <String, List<_FaqItem>>{};
    for (final it in _faqItems) {
      byCategory.putIfAbsent(it.category, () => []).add(it);
    }

    return BrandScaffold(
      title: 'FAQ',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final cat in _categoryOrder)
              if (byCategory[cat] != null) ...[
                settingsSection(context, _categoryLabels[cat] ?? cat),
                BrandCard(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      for (final it in byCategory[cat]!)
                        _FaqTile(item: it),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],
          ],
        ),
      ),
    );
  }
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({required this.item});
  final _FaqItem item;

  @override
  Widget build(BuildContext context) {
    return Theme(
      // Strip the default ExpansionTile divider — BrandCard already
      // provides its own visual frame.
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        onExpansionChanged: (_) => Haptics.selection(),
        tilePadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Text(item.question,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: context.brandInk,
                height: 1.35)),
        expandedAlignment: Alignment.centerLeft,
        children: [
          Text(item.answer,
              style: TextStyle(
                  fontSize: 13, height: 1.5, color: context.brandMuted)),
        ],
      ),
    );
  }
}
