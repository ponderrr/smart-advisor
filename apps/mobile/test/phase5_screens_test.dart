import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/account/account_screen.dart';
import 'package:smart_advisor/features/history/history_screen.dart';
import 'package:smart_advisor/features/library/screens/library_screen.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

/// These screens load via FutureProviders that error gracefully when
/// Supabase isn't initialized (test env) — they must render their brand
/// header + a handled state rather than throw.
Widget _host(Widget child) => ProviderScope(
      child: MaterialApp(theme: AppTheme.light(), home: Scaffold(body: child)),
    );

void main() {
  testWidgets('LibraryScreen renders header + filters', (t) async {
    await t.pumpWidget(_host(const LibraryScreen()));
    await t.pump();
    expect(find.text('Logged & saved'), findsOneWidget);
    expect(t.takeException(), isNull);
  });

  testWidgets('HistoryScreen renders', (t) async {
    await t.pumpWidget(_host(const HistoryScreen()));
    await t.pump();
    expect(find.text('Past picks'), findsOneWidget);
    expect(t.takeException(), isNull);
  });

  testWidgets('AccountScreen renders the settings hub', (t) async {
    await t.pumpWidget(_host(const AccountScreen()));
    await t.pump();
    expect(find.text('Settings'), findsOneWidget); // BrandHeading
    expect(find.text('Appearance'), findsOneWidget); // a settings row
    expect(t.takeException(), isNull);
  });
}
