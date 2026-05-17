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
}

/// Default per-request network timeout (web FETCH_TIMEOUT_MS).
const Duration kFetchTimeout = Duration(milliseconds: 8000);
