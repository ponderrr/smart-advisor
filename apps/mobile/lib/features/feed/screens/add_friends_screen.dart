import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/person_row.dart';

/// Discover-people / add-friend page. "Suggested" people are the distinct
/// authors who've posted, minus yourself and anyone you already follow —
/// loaded via a light authors-only query (not the whole feed). Search
/// filters the list by display name.
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
    final people = ref.watch(suggestedPeopleProvider);

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
          // Taste-graph rail: people followed by people you follow,
          // ranked by overlap. Hidden when the search box is in use
          // (the search list is exhaustive enough on its own) and
          // when you have no follows yet (the provider returns an
          // empty list — falls back to "Suggested" below).
          if (_query.trim().isEmpty) const _MutualSuggestionsRail(),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Suggested')),
          const SizedBox(height: 10),
          ...people.when(
            loading: () => [
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: LoaderFive('Loading')),
              ),
            ],
            error: (_, _) => [
              const MessageBanner.error('Couldn’t load suggestions.'),
            ],
            data: (all) {
              final q = _query.trim().toLowerCase();
              final suggested = all
                  .where((p) =>
                      p.id.isNotEmpty &&
                      p.id != me &&
                      !following.contains(p.id))
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

/// "People you may know" — taste-graph rail above the recent-posters
/// list on the Add friends screen. Silent when the user follows
/// nobody yet (suggestions are empty) so the cold-start surface is
/// just the existing Suggested list.
class _MutualSuggestionsRail extends ConsumerWidget {
  const _MutualSuggestionsRail();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(followSuggestionsProvider);
    final list = async.value ?? const [];
    if (list.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow('People you may know'),
        const SizedBox(height: 10),
        for (final p in list)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: PersonRow(
              id: p.id,
              name: p.name,
              avatarUrl: p.avatarUrl,
              tone: personTone(context, p.id),
              subtitle: p.mutual == 1
                  ? '1 mutual'
                  : '${p.mutual} mutual',
            ),
          ),
        const SizedBox(height: 6),
      ],
    );
  }
}
