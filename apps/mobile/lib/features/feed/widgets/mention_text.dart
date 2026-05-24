import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import 'feed_cards.dart' show openUserProfile;

/// Matches `@handle` only when it starts the body or follows
/// whitespace — keeps emails (foo@bar.com) and double-@ from being
/// rendered as mentions. Handles are [A-Za-z0-9_], 1-32 chars (the
/// username column has no length cap but the UI never offers more
/// than that, and the regex stays cheap).
final _kMentionPattern =
    RegExp(r'(^|\s)@([A-Za-z0-9_]{1,32})', multiLine: true);

/// Renders a comment / post body with `@username` mentions styled as
/// tappable accent-colored spans. Tap → resolve the username to a
/// profile id (round-trips via [FeedService.resolveUsernameToId]) and
/// push the user profile screen, or show a "not found" banner.
///
/// Drop-in for `Text(body, style: …)`. Non-mention text uses [style];
/// mentions inherit [style] then override color/weight from [tone].
class MentionText extends ConsumerWidget {
  const MentionText(
    this.body, {
    super.key,
    required this.style,
    required this.tone,
  });

  final String body;
  final TextStyle style;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matches = _kMentionPattern.allMatches(body).toList();
    if (matches.isEmpty) return Text(body, style: style);

    final mentionStyle = style.copyWith(
      color: tone.text,
      fontWeight: FontWeight.w700,
    );
    final spans = <InlineSpan>[];
    var cursor = 0;
    for (final m in matches) {
      // m.group(1) is the leading whitespace boundary; the mention
      // itself starts at the '@'. Preserve the whitespace so spacing
      // stays exact when the regex eats it.
      final lead = m.group(1) ?? '';
      final handle = m.group(2)!;
      final mentionStart = m.start + lead.length;
      if (mentionStart > cursor) {
        spans.add(TextSpan(text: body.substring(cursor, mentionStart)));
      }
      spans.add(TextSpan(
        text: '@$handle',
        style: mentionStyle,
        recognizer: TapGestureRecognizer()
          ..onTap = () async {
            final svc = ref.read(feedServiceProvider);
            final id = await svc.resolveUsernameToId(handle);
            if (!context.mounted) return;
            if (id == null) {
              showBanner('@$handle not found.',
                  type: AdaptiveSnackBarType.error,
                  duration: const Duration(seconds: 2));
              return;
            }
            openUserProfile(context, id);
          },
      ));
      cursor = m.end;
    }
    if (cursor < body.length) {
      spans.add(TextSpan(text: body.substring(cursor)));
    }

    return RichText(
      text: TextSpan(style: style, children: spans),
    );
  }
}
