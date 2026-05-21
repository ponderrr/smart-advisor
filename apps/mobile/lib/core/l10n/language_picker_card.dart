import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../ui/ui.dart';
import 'locale_provider.dart';

/// Reusable language picker — a BrandCard with "System default" plus every
/// shipped language as a single-select chip. Tapping switches the app
/// language live via [localeProvider].
class LanguagePickerCard extends ConsumerWidget {
  const LanguagePickerCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l = AppLocalizations.of(context);
    // null locale == "system default"; otherwise match the language code.
    final selectedCode = locale?.languageCode ?? kSystemLocaleCode;

    return BrandCard(
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
                onTap: () =>
                    ref.read(localeProvider.notifier).set(kSystemLocaleCode),
              ),
              for (final entry in kLanguageNames.entries)
                _LangChip(
                  label: entry.value,
                  selected: selectedCode == entry.key,
                  onTap: () =>
                      ref.read(localeProvider.notifier).set(entry.key),
                ),
            ],
          ),
        ],
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
