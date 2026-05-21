import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/person_row.dart';

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
                    child: PersonRow(
                      id: person.id,
                      name: person.name,
                      avatarUrl: person.avatarUrl,
                      tone: personTone(context, person.id),
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

