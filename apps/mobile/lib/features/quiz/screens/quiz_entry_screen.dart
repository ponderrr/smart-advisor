import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';

/// Quiz landing: choose a Solo or Group quiz (mirrors the AI mockup).
class QuizEntryScreen extends StatelessWidget {
  const QuizEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const Eyebrow('Quiz'),
        const SizedBox(height: 4),
        const BrandHeading('How do you want to play?', size: 26),
        const SizedBox(height: 20),
        _choice(
          context,
          accent: ContentAccentName.violet,
          icon: Icons.person_outline,
          title: 'Solo quiz',
          body: 'A personality quiz just for you — get one movie, book, '
              'or music pick tailored to your answers.',
          onTap: () => context.go('/quiz/solo'),
        ),
        const SizedBox(height: 14),
        _choice(
          context,
          accent: ContentAccentName.rose,
          icon: Icons.groups_outlined,
          title: 'Group quiz',
          body: 'Host or join a room — everyone answers, and the AI '
              'synthesizes one pick the whole group will enjoy.',
          onTap: () => context.go('/group-quiz'),
        ),
      ],
    );
  }

  Widget _choice(
    BuildContext context, {
    required ContentAccentName accent,
    required IconData icon,
    required String title,
    required String body,
    required VoidCallback onTap,
  }) {
    final tone = contentAccent(accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(icon, color: tone.iconCircleFg, size: 26),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                const SizedBox(height: 4),
                Text(body,
                    style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: context.brandMuted)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: tone.text),
        ]),
      ),
    );
  }
}
