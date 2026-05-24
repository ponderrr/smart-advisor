import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/feed_cards.dart' show openPost, openUserProfile;

/// Global search across people + posts. Two stacked sections: People
/// first (avatar + name + @handle), then Posts (cover thumb + title +
/// author). Empty/under-2-char queries render a blank slate; results
/// debounce ~250ms after the user stops typing so we don't spam ilike.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _ctrl = TextEditingController();
  String _query = '';
  Timer? _debounce;

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() => _query = v.trim());
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showResults = _query.length >= 2;
    return BrandScaffold(
      title: 'Search',
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: AdaptiveTextField(
              controller: _ctrl,
              placeholder: 'Search people and picks…',
              autofocus: true,
              onChanged: _onChanged,
              prefix: Icon(Icons.search,
                  size: 18, color: context.brandMuted),
            ),
          ),
          Expanded(
            child: showResults
                ? _Results(query: _query)
                : Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Subtitle(
                          'Type at least 2 characters to search people and picks.',
                          center: true),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

/// Live results for the current query. Two queries in parallel via
/// the search providers; rendered as section headers + tappable rows.
class _Results extends ConsumerWidget {
  const _Results({required this.query});
  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(searchProfilesProvider(query));
    final posts = ref.watch(searchPostsProvider(query));
    final loading = people.isLoading || posts.isLoading;
    final peopleList = people.value ?? const [];
    final postList = posts.value ?? const [];
    final empty = !loading && peopleList.isEmpty && postList.isEmpty;
    if (loading && peopleList.isEmpty && postList.isEmpty) {
      return const Center(child: LoaderFive('Searching'));
    }
    if (empty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Subtitle('No matches for "$query".', center: true),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        if (peopleList.isNotEmpty) ...[
          Eyebrow('People · ${peopleList.length}'),
          const SizedBox(height: 8),
          for (final p in peopleList) _PersonRow(p: p),
          const SizedBox(height: 18),
        ],
        if (postList.isNotEmpty) ...[
          Eyebrow('Picks · ${postList.length}'),
          const SizedBox(height: 8),
          for (final p in postList) _PostRow(p: p),
        ],
      ],
    );
  }
}

class _PersonRow extends StatelessWidget {
  const _PersonRow({required this.p});
  final ({String id, String name, String? username, String? avatarUrl}) p;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => openUserProfile(context, p.id),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(children: [
          FeedAvatar(name: p.name, url: p.avatarUrl, size: 36),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.name,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                if (p.username != null)
                  Text('@${p.username}',
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
              ],
            ),
          ),
          Icon(Icons.chevron_right,
              size: 18, color: context.brandMuted),
        ]),
      ),
    );
  }
}

class _PostRow extends StatelessWidget {
  const _PostRow({required this.p});
  final ({
    String id,
    String title,
    String? body,
    String? posterUrl,
    FeedCommunity community,
    String author,
    String authorId,
  }) p;

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(p.community.accent, Theme.of(context).brightness);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => openPost(context, p.id),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (p.posterUrl != null)
            PosterThumb(
                url: p.posterUrl,
                square: p.community == FeedCommunity.music,
                w: 44,
                semanticLabel: '${p.title} cover')
          else
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tone.iconCircleBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(p.community.icon,
                  color: tone.iconCircleFg, size: 20),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.title,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${p.community.tag} · ${p.author}',
                    style: TextStyle(
                        fontSize: 11, color: context.brandMuted)),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}
