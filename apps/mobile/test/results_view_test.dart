import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/models/recommendation.dart';
import 'package:smart_advisor/features/recommendations/screens/results_view.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

const _recs = [
  Recommendation(
    id: 'r1',
    userId: 'u1',
    type: 'movie',
    title: 'Past Lives',
    contentType: 'mix',
    createdAt: '2026-05-16T00:00:00Z',
    genres: ['Drama', 'Romance'],
    director: 'Celine Song',
    year: 2023,
    explanation: 'You said you like quiet, aching stories.',
    description: 'Two friends reconnect across decades.',
    matchScore: 93,
  ),
  Recommendation(
    id: 'r2',
    userId: 'u1',
    type: 'book',
    title: 'Piranesi',
    contentType: 'mix',
    createdAt: '2026-05-16T00:00:00Z',
    genres: ['Fantasy'],
    author: 'Susanna Clarke',
    year: 2020,
    explanation: 'Matches your taste for dreamlike worlds.',
    matchScore: 88,
  ),
];

void main() {
  testWidgets('renders cards, match score, and expands why-this-pick',
      (t) async {
    await t.pumpWidget(ProviderScope(
      child: MaterialApp(
        theme: AppTheme.light(),
        home: ResultsView(recommendations: _recs, onRestart: () {}),
      ),
    ));
    await t.pump();
    // Let the staggered flutter_animate entrance finish.
    await t.pump(const Duration(milliseconds: 800));

    expect(find.text('YOUR PICKS'), findsOneWidget); // Eyebrow uppercases
    expect(find.text('Made for you'), findsOneWidget);
    expect(find.text('Past Lives'), findsOneWidget);
    expect(find.text('Piranesi'), findsOneWidget);
    expect(find.text('93%'), findsOneWidget); // match_score used verbatim
    expect(find.text('88%'), findsOneWidget);

    // Cards are tappable summaries now (tap opens the dedicated detail
    // page); why-this-pick lives there, not inline.
    expect(find.text('Get another'), findsOneWidget);
  });
}
