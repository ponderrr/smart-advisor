import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/ui/gallery/gallery_screen.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

void main() {
  for (final (name, theme) in [
    ('light', AppTheme.light()),
    ('dark', AppTheme.dark()),
  ]) {
    testWidgets('GalleryScreen renders every primitive in $name', (t) async {
      await t.pumpWidget(MaterialApp(
        theme: theme,
        home: const GalleryScreen(),
      ));
      await t.pump();

      expect(find.text('Design System · adaptive'), findsOneWidget);
      expect(find.text('Filled'), findsOneWidget);
      expect(find.byType(GalleryScreen), findsOneWidget);
      expect(t.takeException(), isNull);

      // LoaderFive runs a repeating ticker; tear the tree down so it's
      // disposed before the test ends.
      await t.pumpWidget(const SizedBox());
    });
  }
}
