import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../settings/settings_service.dart';

/// Appearance — theme mode + AMOLED + app language. Theme block relocated
/// verbatim from the old AccountScreen "Preferences" card; the language
/// picker is the post-onboarding home for the choice made on the
/// onboarding language step.
class AppearanceSettingsScreen extends ConsumerWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final amoled = ref.watch(amoledProvider);
    final locale = ref.watch(localeProvider);
    final l = AppLocalizations.of(context);
    // null locale == "system default"; otherwise match the language code.
    final selectedCode = locale?.languageCode ?? kSystemLocaleCode;

    return BrandScaffold(
      title: 'Appearance',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BrandCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Theme',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: context.colors.foreground)),
                    const SizedBox(height: 8),
                    BrandSegmented(
                      color: Tw.indigo500,
                      labels: const ['System', 'Light', 'Dark'],
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
                            Text('AMOLED dark',
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: context.colors.foreground)),
                            const SizedBox(height: 2),
                            Subtitle('True-black surfaces in dark mode.'),
                          ],
                        ),
                      ),
                      AdaptiveSwitch(
                        value: amoled,
                        onChanged: (v) =>
                            ref.read(amoledProvider.notifier).set(v),
                      ),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              BrandCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l.languageStepEyebrow,
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: context.colors.foreground)),
                    const SizedBox(height: 2),
                    Subtitle(l.languageStepSubtitle),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _LangChip(
                          label: l.languageSystemDefault,
                          selected: selectedCode == kSystemLocaleCode,
                          onTap: () => ref
                              .read(localeProvider.notifier)
                              .set(kSystemLocaleCode),
                        ),
                        for (final entry in kLanguageNames.entries)
                          _LangChip(
                            label: entry.value,
                            selected: selectedCode == entry.key,
                            onTap: () => ref
                                .read(localeProvider.notifier)
                                .set(entry.key),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Single-select language pill — fills with the indigo accent when active.
class _LangChip extends StatelessWidget {
  const _LangChip(
      {required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? Tw.indigo500 : c.muted,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? Colors.transparent : c.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: selected ? Colors.white : c.foreground,
          ),
        ),
      ),
    );
  }
}
