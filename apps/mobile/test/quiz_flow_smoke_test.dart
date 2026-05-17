import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/quiz/screens/quiz_screen.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

void main() {
  testWidgets('quiz starts at content step and advances to count', (t) async {
    await t.pumpWidget(ProviderScope(
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const QuizScreen(),
      ),
    ));
    await t.pump();

    expect(find.text('What are you in the mood for?'), findsOneWidget);

    // Bento tiles make the step scroll; bring Continue into view.
    await t.ensureVisible(find.text('Continue'));
    await t.tap(find.text('Continue'));
    await t.pumpAndSettle();

    expect(find.text('How many questions?'), findsOneWidget);
  });
}
