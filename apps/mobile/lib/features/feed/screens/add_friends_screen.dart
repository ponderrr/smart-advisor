import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/follow_button.dart';

/// A suggested person derived from the feed.
typedef _Person = ({String id, String name, String? avatarUrl});

/// Discover-people / add-friend page. "Suggested" people are the distinct
/// authors who've posted in the feed, minus yourself and anyone you
/// already follow. Search filters the list by display name.
class AddFriendsScreen extends ConsumerStatefulWidget {
  const AddFriendsScreen({super.key});

  @override
  ConsumerState<AddFriendsScreen> createState() =>
      _AddFriendsScreenState();
}

class _AddFriendsScreenState extends ConsumerState<AddFriendsScreen> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  ContentAccentName _accentFor(String id) {
    const names = ContentAccentName.values;
    return names[id.hashCode.abs() % names.length];
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    final following =
        ref.watch(followingProvider).value?.toSet() ?? <String>{};
    final feed = ref.watch(feedProvider);

    return BrandScaffold(
      title: 'Add friends',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          AdaptiveTextField(
            controller: _search,
            placeholder: 'Search by name',
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 6),
          Subtitle("People who've shared picks in your feed."),
          const SizedBox(height: 16),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Suggested')),
          const SizedBox(height: 10),
          ...feed.when(
            loading: () => [
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: LoaderFive('Loading')),
              ),
            ],
            error: (_, _) => [
              const MessageBanner.error('Couldn’t load suggestions.'),
            ],
            data: (posts) {
              final seen = <String, _Person>{};
              for (final p in posts) {
                if (p.authorId.isNotEmpty &&
                    p.authorId != me &&
                    !following.contains(p.authorId) &&
                    !seen.containsKey(p.authorId)) {
                  seen[p.authorId] = (
                    id: p.authorId,
                    name: p.author,
                    avatarUrl: p.authorAvatarUrl,
                  );
                }
              }
              final q = _query.trim().toLowerCase();
              final suggested = seen.values
                  .where((p) =>
                      q.isEmpty || p.name.toLowerCase().contains(q))
                  .toList()
                ..sort((a, b) => a.name.compareTo(b.name));
              if (suggested.isEmpty) {
                return [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Subtitle(
                        q.isEmpty
                            ? 'Nobody in your feed yet.'
                            : 'No matches for that name.',
                        center: true),
                  ),
                ];
              }
              return [
                for (final person in suggested)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PersonRow(
                      person: person,
                      tone: contentAccent(_accentFor(person.id),
                          Theme.of(context).brightness),
                    ),
                  ),
              ];
            },
          ),
        ],
      ),
    );
  }
}

/// A suggested person: avatar + name + the shared [FollowButton].
class _PersonRow extends StatelessWidget {
  const _PersonRow({required this.person, required this.tone});
  final _Person person;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context) {
    return BrandCard(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        Semantics(
          button: true,
          label: "Open ${person.name}'s profile",
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => context.push('/feed/u/${person.id}'),
            child: ExcludeSemantics(
              child: FeedAvatar(
                  name: person.name, url: person.avatarUrl, size: 44),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => context.push('/feed/u/${person.id}'),
            child: Text(person.name,
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: context.brandInk)),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 132,
          child: FollowButton(
              authorId: person.id, authorName: person.name, tone: tone),
        ),
      ]),
    );
  }
}
