import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';
import '../../l10n/app_localizations.dart';
import '../../ui/ui.dart';

/// Single pre-auth welcome screen, shown once on first launch before sign
/// in / sign up. A clean branded gradient — the brand mark, the pitch,
/// the three content types, and the CTAs. (Replaced the earlier animated
/// poster-wall mosaic, which loaded flaky network covers and read busy.)
///
/// One-time gating: tapping a CTA flips [StorageKeys.introSeen] so
/// returning users land on /auth directly.
///
/// [previewMode] is the Settings "Replay welcome" entry — signed-in users
/// see the same screen but the CTAs collapse to a single "Close".
class GetStartedScreen extends ConsumerStatefulWidget {
  const GetStartedScreen({super.key, this.previewMode = false});

  final bool previewMode;

  @override
  ConsumerState<GetStartedScreen> createState() => _S();
}

class _S extends ConsumerState<GetStartedScreen> {
  bool _navigating = false;

  Future<void> _markSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(StorageKeys.introSeen, true);
    ref.invalidate(sharedPreferencesProvider);
  }

  Future<void> _go(String path) async {
    if (_navigating) return;
    setState(() => _navigating = true);
    await _markSeen();
    if (mounted) context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: Tw.slate950,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _Backdrop(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(flex: 2),
                  // Brand mark.
                  Center(
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Tw.indigo500, Tw.violet500],
                        ),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [
                          BoxShadow(
                            color: Tw.violet500.withValues(alpha: .45),
                            blurRadius: 32,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.bookmark_rounded,
                          size: 38, color: Colors.white),
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .scaleXY(
                          begin: 0.8, end: 1, curve: Curves.easeOutBack),
                  const SizedBox(height: 18),
                  Text(
                    'Smart Advisor',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .95),
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                  const SizedBox(height: 22),
                  Text(
                    l.getStartedHeadline,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      height: 1.1,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.6,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 320.ms, duration: 460.ms)
                      .slideY(begin: 0.16, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 14),
                  Text(
                    l.getStartedBody,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .78),
                      fontSize: 15,
                      height: 1.45,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 440.ms, duration: 460.ms)
                      .slideY(begin: 0.12, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 22),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      _ContentChip(
                          icon: Icons.movie_outlined,
                          label: 'Movies',
                          color: Tw.amber500),
                      SizedBox(width: 10),
                      _ContentChip(
                          icon: Icons.menu_book_outlined,
                          label: 'Books',
                          color: Tw.emerald500),
                      SizedBox(width: 10),
                      _ContentChip(
                          icon: Icons.music_note_outlined,
                          label: 'Music',
                          color: Tw.rose500),
                    ],
                  )
                      .animate()
                      .fadeIn(delay: 560.ms, duration: 420.ms)
                      .slideY(begin: 0.12, end: 0, curve: Curves.easeOut),
                  const Spacer(flex: 3),
                  if (widget.previewMode)
                    _PrimaryCta(
                      label: l.closePreview,
                      onPressed: () => Navigator.of(context).pop(),
                    ).animate().fadeIn(delay: 680.ms, duration: 360.ms)
                  else ...[
                    _PrimaryCta(
                      label: l.getStartedPrimary,
                      onPressed:
                          _navigating ? null : () => _go('/auth/signup'),
                    )
                        .animate()
                        .fadeIn(delay: 680.ms, duration: 360.ms)
                        .slideY(
                            begin: 0.16, end: 0, curve: Curves.easeOut),
                    const SizedBox(height: 10),
                    _SecondaryCta(
                      label: l.getStartedSecondary,
                      onPressed: _navigating ? null : () => _go('/auth'),
                    )
                        .animate()
                        .fadeIn(delay: 760.ms, duration: 360.ms)
                        .slideY(
                            begin: 0.16, end: 0, curve: Curves.easeOut),
                  ],
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Branded gradient backdrop — a deep indigo→violet wash with a few soft
/// colour glows. No network images, nothing animated; just calm depth.
class _Backdrop extends StatelessWidget {
  const _Backdrop();

  Widget _glow(Color color, double size) => IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              color.withValues(alpha: .38),
              color.withValues(alpha: 0),
            ]),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF1E1B4B),
                Tw.slate950,
                Color(0xFF190A2E),
              ],
            ),
          ),
        ),
        Positioned(
            top: -130, left: -90, child: _glow(Tw.indigo500, 320)),
        Positioned(
            bottom: -110, right: -90, child: _glow(Tw.violet500, 340)),
        Positioned(
            bottom: 130, left: -130, child: _glow(Tw.rose500, 240)),
      ],
    );
  }
}

/// One of the three content-type pills under the pitch.
class _ContentChip extends StatelessWidget {
  const _ContentChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: .35)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: .92),
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
            )),
      ]),
    );
  }
}

/// Bright, branded primary CTA — indigo→violet gradient pill.
class _PrimaryCta extends StatelessWidget {
  const _PrimaryCta({required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Tw.indigo500, Tw.violet500],
            ),
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              BoxShadow(
                color: Tw.indigo500
                    .withValues(alpha: disabled ? .15 : .4),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Quieter sibling — a glassy pill that still reads on the dark backdrop.
class _SecondaryCta extends StatelessWidget {
  const _SecondaryCta({required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .08),
            borderRadius: BorderRadius.circular(999),
            border:
                Border.all(color: Colors.white.withValues(alpha: .25)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: .92),
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
