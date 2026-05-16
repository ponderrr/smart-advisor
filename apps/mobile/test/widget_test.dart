import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:smart_advisor/features/home/home_screen.dart';

void main() {
  testWidgets('HomeScreen renders the Phase 0 skeleton', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));

    expect(find.text('Smart Advisor'), findsOneWidget);
    expect(
      find.text('Phase 0 skeleton — Flutter + Supabase wired.'),
      findsOneWidget,
    );
  });
}
