import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/follow_button.dart';

/// Discover-people / add-friend page. There's no backend — "suggested"
/// people are the distinct post authors from the in-memory feed, minus
/// yourself and anyone you already follow. Searching for a handle that
/// isn't in the list offers an "Add @handle" affordance that follows that
/// arbitrary username, consistent with the prototype mock model.
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

  ContentAccentName _accentFor(String username) {
    const names = ContentAccentName.values;
    return names[username.hashCode.abs() % names.length];
  }

  @override
  Widget build(BuildContext context) {
    final following = ref.watch(followingProvider);
    final authors = <String>{
      for (final p in ref.watch(feedProvider)) p.author,
    }..removeWhere((a) => a == 'you' || following.contains(a));

    final q = _query.trim().toLowerCase();
    final suggested = (q.isEmpty
            ? authors.toList()
            : authors
                .where((a) => a.toLowerCase().contains(q))
                .toList())
      ..sort();

    // Offer to follow an arbitrary handle when the typed name doesn't
    // match any suggestion (and isn't yourself / already followed).
    final showAddArbitrary = q.isNotEmpty &&
        q != 'you' &&
        !following.contains(q) &&
        !authors.any((a) => a.toLowerCase() == q);

    return BrandScaffold(
      title: 'Add friends',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          AdaptiveTextField(
            controller: _search,
            placeholder: 'Search by username',
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 6),
          Subtitle('People from your feed — this prototype follows are '
              'in-memory only.'),
          const SizedBox(height: 16),
          if (showAddArbitrary) ...[
            _AddHandleRow(
              handle: q,
              onAdd: () {
                final nowFollowing = ref
                    .read(followingProvider.notifier)
                    .toggle(q);
                showBanner(
                  nowFollowing
                      ? 'Following u/$q'
                      : 'Unfollowed u/$q',
                  type: nowFollowing
                      ? AdaptiveSnackBarType.success
                      : AdaptiveSnackBarType.info,
                );
                setState(() {
                  _search.clear();
                  _query = '';
                });
              },
            ),
            const SizedBox(height: 16),
          ],
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Suggested')),
          const SizedBox(height: 10),
          if (suggested.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Subtitle(
                  q.isEmpty
                      ? 'You already follow everyone in your feed.'
                      : 'No one here by that name.',
                  center: true),
            )
          else
            for (final username in suggested)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _PersonRow(
                  username: username,
                  tone: contentAccent(_accentFor(username),
                      Theme.of(context).brightness),
                ),
              ),
        ],
      ),
    );
  }
}

/// A suggested person: avatar + handle + the shared [FollowButton]
/// (already toggles followingProvider and guards "you").
class _PersonRow extends StatelessWidget {
  const _PersonRow({required this.username, required this.tone});
  final String username;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context) {
    return BrandCard(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => context.push('/feed/u/$username'),
          child: FeedAvatar(name: username, size: 44),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => context.push('/feed/u/$username'),
            child: Text('u/$username',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: context.brandInk)),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 132,
          child: FollowButton(username: username, tone: tone),
        ),
      ]),
    );
  }
}

/// "Add @handle" affordance for an arbitrary handle not in the feed.
class _AddHandleRow extends StatelessWidget {
  const _AddHandleRow({required this.handle, required this.onAdd});
  final String handle;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onAdd,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(Icons.person_add_alt_1,
                size: 19, color: tone.iconCircleFg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Add @$handle',
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                const SizedBox(height: 2),
                Text('Follow this handle',
                    style: TextStyle(
                        fontSize: 12, color: tone.text)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: tone.text),
        ]),
      ),
    );
  }
}
