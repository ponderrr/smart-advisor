/// Ported from web src/lib/constants.ts. Kept verbatim so the mobile client
/// and web stay in lockstep against the same backend contract.
class ApiUrls {
  const ApiUrls._();

  static const String openLibrarySearch =
      'https://openlibrary.org/search.json';
  static const String openLibraryCovers =
      'https://covers.openlibrary.org/b/id';
  static const String openLibraryBase = 'https://openlibrary.org';
  static const String tmdbBase = 'https://api.themoviedb.org/3';
  static const String tmdbImage = 'https://image.tmdb.org/t/p/w500';
  static const String tmdbWeb = 'https://www.themoviedb.org';
  static const String deezerApi = 'https://api.deezer.com';
  static const String ipify = 'https://api.ipify.org?format=json';
  static const String siteUrl = 'https://smartadvisor.live';
}

class StorageKeys {
  const StorageKeys._();

  static const String prefContentFocus = 'smart_advisor_pref_content_focus';
  static const String prefDiscovery = 'smart_advisor_pref_discovery';
  static const String prefQuestionCount = 'smart_advisor_pref_question_count';
  static const String prefContentTone = 'smart_advisor_pref_content_tone';
  static const String dismissedBanners = 'smart_advisor_dismissed_banners';
  static const String demoAnswers = 'smart_advisor_demo_answers';

  /// Set once the pre-auth intro carousel has been seen, so returning
  /// users go straight to the auth screen.
  static const String introSeen = 'smart_advisor_intro_seen';

  /// Feed profile visibility ("public"|"private"). Same key string as the
  /// web localStorage (use-feed-visibility.ts) so a future shared backend
  /// migration is mechanical.
  static const String prefFeedVisibility =
      'smart_advisor_pref_feed_visibility';

  /// Per-device feed display prefs (view/scope/community/commentSort) as a
  /// single JSON blob — exact web key string (use-feed-prefs.ts).
  static const String prefFeedPrefs = 'smart_advisor_pref_feed_prefs';

  /// Taste tuning / hard filters mirror (avoidGenres / maxRuntimeMinutes /
  /// language / avoidNote) as a single JSON blob, hot-cached for the AI
  /// service in parity with the content-tone cache.
  static const String prefRecommendationFilters =
      'smart_advisor_pref_recommendation_filters';

  /// Per-device UI language (BCP-47 code, e.g. "en", "fr", "ja"). The
  /// onboarding language step + the server-side profile.locale stay in
  /// sync with this; the app reads it to localise the interface.
  static const String prefLocale = 'smart_advisor_pref_locale';
}

/// Default per-request network timeout (web FETCH_TIMEOUT_MS).
const Duration kFetchTimeout = Duration(milliseconds: 8000);
