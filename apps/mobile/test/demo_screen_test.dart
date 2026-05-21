import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/demo/demo_screen.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

void main() {
  testWidgets('Demo starts at Q1 with content options', (t) async {
    await t.pumpWidget(ProviderScope(
      child: MaterialApp(theme: AppTheme.light(), home: const DemoScreen()),
    ));
    await t.pump();

    expect(find.text('What are you in the mood for?'), findsOneWidget);
    // The first step is the content picker — all four options present.
    expect(find.text('Movie'), findsWidgets);
    expect(find.text('Book'), findsWidgets);
    expect(find.text('Music'), findsWidgets);
    expect(find.text('Mix'), findsWidgets);
  });
}
