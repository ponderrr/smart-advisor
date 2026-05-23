import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../settings/settings_service.dart';

/// Appearance — theme mode + AMOLED. Relocated verbatim from the old
/// AccountScreen "Preferences" card (theme + AMOLED block only). The app
/// language picker lives on the Profile screen.
class AppearanceSettingsScreen extends ConsumerWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final themeMode = ref.watch(themeModeProvider);
    final amoled = ref.watch(amoledProvider);

    return BrandScaffold(
      title: l.appearanceTitle,
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l.themeLabel,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: context.colors.foreground)),
              const SizedBox(height: 8),
              BrandSegmented(
                color: Tw.indigo500,
                labels: [l.themeSystem, l.themeLight, l.themeDark],
                selectedIndex: switch (themeMode) {
                  ThemeMode.system => 0,
                  ThemeMode.light => 1,
                  ThemeMode.dark => 2,
                },
                onValueChanged: (i) => ref
                    .read(themeModeProvider.notifier)
                    .set(switch (i) {
                      1 => ThemeMode.light,
                      2 => ThemeMode.dark,
                      _ => ThemeMode.system,
                    }),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.amoledDarkTitle,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: context.colors.foreground)),
                      const SizedBox(height: 2),
                      Subtitle(l.amoledDarkSubtitle),
                    ],
                  ),
                ),
                AdaptiveSwitch(
                  value: amoled,
                  onChanged: (v) {
                    Haptics.selection();
                    ref.read(amoledProvider.notifier).set(v);
                  },
                ),
              ]),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
