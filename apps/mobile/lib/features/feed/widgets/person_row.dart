import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';
import 'feed_avatar.dart';
import 'follow_button.dart';

/// A person in a discover / friends list: avatar + name (both open the
/// profile) with the shared [FollowButton] on the right. Used by both the
/// "Add friends" discover screen and the Friends list.
class PersonRow extends StatelessWidget {
  const PersonRow({
    super.key,
    required this.id,
    required this.name,
    required this.avatarUrl,
    required this.tone,
  });

  final String id;
  final String name;
  final String? avatarUrl;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context) {
    void openProfile() => context.push('/feed/u/$id');
    return BrandCard(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        Semantics(
          button: true,
          label: "Open $name's profile",
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: openProfile,
            child: ExcludeSemantics(
              child: FeedAvatar(name: name, url: avatarUrl, size: 44),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: openProfile,
            child: Text(name,
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: context.brandInk)),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 132,
          child:
              FollowButton(authorId: id, authorName: name, tone: tone),
        ),
      ]),
    );
  }
}

/// Maps a profile id to a stable content accent — the shared scheme used
/// by the discover + friends lists so a person keeps the same hue.
ContentAccentTone personTone(BuildContext context, String id) {
  const names = ContentAccentName.values;
  return contentAccent(
      names[id.hashCode.abs() % names.length],
      Theme.of(context).brightness);
}
