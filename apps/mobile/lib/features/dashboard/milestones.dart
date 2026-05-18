import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/enums.dart';
import '../../core/models/library_item.dart';
import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../ui/ui.dart';
import '../recommendations/services/database_service.dart';

/// Difficulty buckets, easy → master (web `AchievementTier`).
enum MilestoneTier { easy, medium, hard, master }

extension MilestoneTierX on MilestoneTier {
  String get label => switch (this) {
        MilestoneTier.easy => 'Easy',
        MilestoneTier.medium => 'Medium',
        MilestoneTier.hard => 'Hard',
        MilestoneTier.master => 'Master',
      };
}

class Milestone {
  const Milestone({
    required this.id,
    required this.tier,
    required this.label,
    required this.description,
    required this.icon,
    required this.accent,
    required this.progress,
    required this.target,
  });

  final String id;
  final MilestoneTier tier;
  final String label;
  final String description;
  final IconData icon;
  final ContentAccentName accent;
  final int progress;
  final int target;

  bool get earned => progress >= target;
  double get fraction => (progress / target).clamp(0.0, 1.0);
}

class MilestonesData {
  const MilestonesData({required this.list, required this.earned});
  final List<Milestone> list;
  final int earned;
  int get total => list.length;

  List<Milestone> forTier(MilestoneTier t) =>
      list.where((m) => m.tier == t).toList();
}

/// Dashboard milestone/achievement list — ported verbatim from the web
/// `useAchievements` hook (same ids, targets, copy, ordering).
final milestonesProvider =
    FutureProvider.autoDispose<MilestonesData>((ref) async {
  final db = ref.watch(databaseServiceProvider);
  final recsRes =
      await db.getUserRecommendations(const RecommendationFilter(limit: 1000));
  final recs = recsRes.data ?? const <Recommendation>[];
  final libRes = await ref.watch(libraryServiceProvider).list();
  final lib = libRes.data ?? const <LibraryItem>[];

  int byType(String t) => recs.where((r) => r.type == t).length;
  final movies = byType('movie');
  final books = byType('book');
  final music = byType('music');
  final total = recs.length;
  final favorites = recs.where((r) => r.isFavorited).length;

  final uniqueGenres = <String>{};
  for (final r in recs) {
    for (final g in r.genres) {
      final k = g.toLowerCase().trim();
      if (k.isNotEmpty) uniqueGenres.add(k);
    }
  }
  final genreCount = uniqueGenres.length;
  final finishedCount =
      lib.where((i) => i.status == LibraryStatus.finished).length;
  final ratedCount = lib.where((i) => i.rating != null).length;
  final streak = _computeStreak(recs, lib);

  final list = <Milestone>[
    // ---------------- EASY ----------------
    Milestone(
        id: 'first-pick',
        tier: MilestoneTier.easy,
        label: 'First Pick',
        description: 'Get your first recommendation from the quiz.',
        icon: Icons.auto_awesome,
        accent: ContentAccentName.violet,
        progress: total,
        target: 1),
    Milestone(
        id: 'ten-picks',
        tier: MilestoneTier.easy,
        label: '10 Picks',
        description: 'Get 10 recommendations across any mix of quizzes.',
        icon: Icons.trending_up,
        accent: ContentAccentName.violet,
        progress: total,
        target: 10),
    Milestone(
        id: 'wide-taste',
        tier: MilestoneTier.easy,
        label: 'Wide Taste',
        description: 'Get recommendations covering 5 different genres.',
        icon: Icons.bar_chart,
        accent: ContentAccentName.violet,
        progress: genreCount,
        target: 5),
    Milestone(
        id: 'cinephile',
        tier: MilestoneTier.easy,
        label: 'Cinephile',
        description: 'Collect 10 movie recommendations.',
        icon: Icons.movie_outlined,
        accent: ContentAccentName.amber,
        progress: movies,
        target: 10),
    Milestone(
        id: 'bookworm',
        tier: MilestoneTier.easy,
        label: 'Bookworm',
        description: 'Collect 10 book recommendations.',
        icon: Icons.menu_book_outlined,
        accent: ContentAccentName.amber,
        progress: books,
        target: 10),
    Milestone(
        id: 'melomaniac',
        tier: MilestoneTier.easy,
        label: 'Melomaniac',
        description: 'Collect 10 album recommendations.',
        icon: Icons.music_note_outlined,
        accent: ContentAccentName.rose,
        progress: music,
        target: 10),
    Milestone(
        id: 'curator',
        tier: MilestoneTier.easy,
        label: 'Curator',
        description: 'Favorite 5 recommendations in your history.',
        icon: Icons.favorite,
        accent: ContentAccentName.rose,
        progress: favorites,
        target: 5),
    Milestone(
        id: 'reflective',
        tier: MilestoneTier.easy,
        label: 'Reflective',
        description: 'Rate 5 items in your library.',
        icon: Icons.thumb_up_alt_outlined,
        accent: ContentAccentName.emerald,
        progress: ratedCount,
        target: 5),
    // ---------------- MEDIUM ----------------
    Milestone(
        id: 'twenty-five-picks',
        tier: MilestoneTier.medium,
        label: '25 Picks',
        description: 'Stack up 25 recommendations.',
        icon: Icons.trending_up,
        accent: ContentAccentName.violet,
        progress: total,
        target: 25),
    Milestone(
        id: 'genre-explorer',
        tier: MilestoneTier.medium,
        label: 'Genre Explorer',
        description: 'Branch out to 10 different genres.',
        icon: Icons.bar_chart,
        accent: ContentAccentName.violet,
        progress: genreCount,
        target: 10),
    Milestone(
        id: 'librarian',
        tier: MilestoneTier.medium,
        label: 'Librarian',
        description: 'Log 20 items into your library.',
        icon: Icons.library_add_check_outlined,
        accent: ContentAccentName.emerald,
        progress: lib.length,
        target: 20),
    Milestone(
        id: 'completionist',
        tier: MilestoneTier.medium,
        label: 'Completionist',
        description: 'Mark 10 library items as finished.',
        icon: Icons.emoji_events_outlined,
        accent: ContentAccentName.amber,
        progress: finishedCount,
        target: 10),
    Milestone(
        id: 'critic',
        tier: MilestoneTier.medium,
        label: 'Critic',
        description: 'Rate 25 items in your library.',
        icon: Icons.thumb_up_alt_outlined,
        accent: ContentAccentName.emerald,
        progress: ratedCount,
        target: 25),
    Milestone(
        id: 'week-streak',
        tier: MilestoneTier.medium,
        label: 'Week Streak',
        description: 'Use Smart Advisor 7 days in a row.',
        icon: Icons.local_fire_department_outlined,
        accent: ContentAccentName.amber,
        progress: streak,
        target: 7),
    // ---------------- HARD ----------------
    Milestone(
        id: 'half-century',
        tier: MilestoneTier.hard,
        label: 'Half Century',
        description: 'Reach 50 recommendations.',
        icon: Icons.trending_up,
        accent: ContentAccentName.violet,
        progress: total,
        target: 50),
    Milestone(
        id: 'centurion',
        tier: MilestoneTier.hard,
        label: 'Centurion',
        description: '100 recommendations is no joke.',
        icon: Icons.emoji_events_outlined,
        accent: ContentAccentName.violet,
        progress: total,
        target: 100),
    Milestone(
        id: 'cinema-master',
        tier: MilestoneTier.hard,
        label: 'Cinema Master',
        description: 'Collect 50 movie recommendations.',
        icon: Icons.movie_outlined,
        accent: ContentAccentName.amber,
        progress: movies,
        target: 50),
    Milestone(
        id: 'voracious',
        tier: MilestoneTier.hard,
        label: 'Voracious Reader',
        description: 'Collect 50 book recommendations.',
        icon: Icons.menu_book_outlined,
        accent: ContentAccentName.amber,
        progress: books,
        target: 50),
    Milestone(
        id: 'audiophile',
        tier: MilestoneTier.hard,
        label: 'Audiophile',
        description: 'Collect 50 album recommendations.',
        icon: Icons.music_note_outlined,
        accent: ContentAccentName.rose,
        progress: music,
        target: 50),
    Milestone(
        id: 'genre-master',
        tier: MilestoneTier.hard,
        label: 'Genre Master',
        description: 'Cover 20 different genres.',
        icon: Icons.bar_chart,
        accent: ContentAccentName.violet,
        progress: genreCount,
        target: 20),
    Milestone(
        id: 'maven',
        tier: MilestoneTier.hard,
        label: 'Maven',
        description: 'Favorite 25 recommendations.',
        icon: Icons.favorite,
        accent: ContentAccentName.rose,
        progress: favorites,
        target: 25),
    Milestone(
        id: 'marathon',
        tier: MilestoneTier.hard,
        label: 'Marathon',
        description: 'Keep a 30-day Smart Advisor streak.',
        icon: Icons.local_fire_department_outlined,
        accent: ContentAccentName.amber,
        progress: streak,
        target: 30),
    // ---------------- MASTER ----------------
    Milestone(
        id: 'legend',
        tier: MilestoneTier.master,
        label: 'Legend',
        description: 'Reach 250 recommendations — a true legend.',
        icon: Icons.emoji_events_outlined,
        accent: ContentAccentName.violet,
        progress: total,
        target: 250),
    Milestone(
        id: 'movie-mogul',
        tier: MilestoneTier.master,
        label: 'Movie Mogul',
        description: 'Collect 100 movie recommendations.',
        icon: Icons.movie_outlined,
        accent: ContentAccentName.amber,
        progress: movies,
        target: 100),
    Milestone(
        id: 'library-royal',
        tier: MilestoneTier.master,
        label: 'Library Royal',
        description: 'Collect 100 book recommendations.',
        icon: Icons.menu_book_outlined,
        accent: ContentAccentName.amber,
        progress: books,
        target: 100),
    Milestone(
        id: 'music-mogul',
        tier: MilestoneTier.master,
        label: 'Music Mogul',
        description: 'Collect 100 album recommendations.',
        icon: Icons.music_note_outlined,
        accent: ContentAccentName.rose,
        progress: music,
        target: 100),
    Milestone(
        id: 'polymath',
        tier: MilestoneTier.master,
        label: 'Polymath',
        description: 'Get recommendations across 30 different genres.',
        icon: Icons.bar_chart,
        accent: ContentAccentName.violet,
        progress: genreCount,
        target: 30),
    Milestone(
        id: 'patron',
        tier: MilestoneTier.master,
        label: 'Patron',
        description: 'Favorite 50 recommendations.',
        icon: Icons.favorite,
        accent: ContentAccentName.rose,
        progress: favorites,
        target: 50),
    Milestone(
        id: 'tastemaker',
        tier: MilestoneTier.master,
        label: 'Tastemaker',
        description: 'Rate 100 items in your library.',
        icon: Icons.thumb_up_alt_outlined,
        accent: ContentAccentName.emerald,
        progress: ratedCount,
        target: 100),
    Milestone(
        id: 'year-long',
        tier: MilestoneTier.master,
        label: 'Year-Long',
        description: 'Keep a 365-day Smart Advisor streak. Yes, really.',
        icon: Icons.local_fire_department_outlined,
        accent: ContentAccentName.amber,
        progress: streak,
        target: 365),
  ];

  final earned = list.where((m) => m.earned).length;
  return MilestonesData(list: list, earned: earned);
});

/// Consecutive-day streak across recommendation + library activity,
/// counting back from today (or yesterday). Port of the web `streak` memo.
int _computeStreak(List<Recommendation> recs, List<LibraryItem> lib) {
  String key(DateTime d) => '${d.year}-${d.month}-${d.day}';
  final days = <String>{};
  for (final r in recs) {
    final d = DateTime.tryParse(r.createdAt);
    if (d != null) days.add(key(d.toLocal()));
  }
  for (final i in lib) {
    final d = DateTime.tryParse(i.loggedAt);
    if (d != null) days.add(key(d.toLocal()));
  }
  if (days.isEmpty) return 0;
  final now = DateTime.now();
  DateTime cursor;
  if (days.contains(key(now))) {
    cursor = now;
  } else if (days.contains(key(now.subtract(const Duration(days: 1))))) {
    cursor = now.subtract(const Duration(days: 1));
  } else {
    return 0;
  }
  var count = 0;
  while (days.contains(key(cursor))) {
    count += 1;
    cursor = cursor.subtract(const Duration(days: 1));
  }
  return count;
}
