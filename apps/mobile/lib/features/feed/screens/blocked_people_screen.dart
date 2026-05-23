import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/feed_avatar.dart';

/// Threshold above which the list shows a live search field — for a
/// handful of blocked profiles a search box is overkill, but a long
/// list with no filter is the painful state.
const _searchThreshold = 6;

/// Blocked-people management. Lists the in-memory blocked-handles set
/// from [blockedProvider] with an inline unblock action; reads as
/// "Settings → Feed → Blocked people". The feed-side block action lives
/// on each PostCard's three-dot menu and writes to the same provider.
class BlockedPeopleScreen extends ConsumerStatefulWidget {
  const BlockedPeopleScreen({super.key});

  @override
  ConsumerState<BlockedPeopleScreen> createState() =>
      _BlockedPeopleScreenState();
}

class _BlockedPeopleScreenState extends ConsumerState<BlockedPeopleScreen> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final blocked = ref.watch(blockedProfilesProvider);

    return BrandScaffold(
      title: l.blockedPeopleTitle,
      body: ResponsiveCenter(
        maxWidth: 560,
        child: blocked.when(
          loading: () => Center(child: LoaderFive(l.loading)),
          error: (_, _) => Padding(
            padding: const EdgeInsets.all(20),
            child: MessageBanner.error(l.blockedLoadError),
          ),
          data: (people) {
            if (people.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.block,
                        size: 48,
                        color: context.colors.mutedForeground),
                    const SizedBox(height: 12),
                    BrandHeading(l.blockedEmptyTitle, size: 22),
                    const SizedBox(height: 6),
                    Subtitle(l.blockedEmptyBody, center: true),
                  ],
                ),
              );
            }

            final sorted = [...people]
              ..sort((a, b) => a.name.toLowerCase()
                  .compareTo(b.name.toLowerCase()));
            final showSearch = sorted.length >= _searchThreshold;
            final q = _query.trim().toLowerCase();
            final filtered = q.isEmpty
                ? sorted
                : sorted
                    .where((p) => p.name.toLowerCase().contains(q))
                    .toList();

            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(children: [
                  Expanded(
                    child: Text(
                      '${sorted.length} blocked',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: context.brandMuted),
                    ),
                  ),
                  if (showSearch && q.isNotEmpty)
                    Text(
                      '${filtered.length} match${filtered.length == 1 ? '' : 'es'}',
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted),
                    ),
                ]),
                const SizedBox(height: 10),
                if (showSearch) ...[
                  AdaptiveTextField(
                    controller: _search,
                    placeholder: 'Search by name',
                    onChanged: (v) => setState(() => _query = v),
                  ),
                  const SizedBox(height: 14),
                ],
                if (filtered.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Subtitle('No matches.', center: true),
                  )
                else
                  for (int i = 0; i < filtered.length; i++) ...[
                    _BlockedRow(
                      name: filtered[i].name,
                      avatarUrl: filtered[i].avatarUrl,
                      onUnblock: () {
                        ref
                            .read(feedActionsProvider)
                            .unblock(filtered[i].id);
                        showBanner(
                            l.blockedUnblockedToast(filtered[i].name));
                      },
                    ),
                    if (i < filtered.length - 1)
                      const SizedBox(height: 10),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _BlockedRow extends StatelessWidget {
  const _BlockedRow({
    required this.name,
    required this.avatarUrl,
    required this.onUnblock,
  });
  final String name;
  final String? avatarUrl;
  final VoidCallback onUnblock;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final c = context.colors;
    return BrandCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          FeedAvatar(name: name, url: avatarUrl, size: 36),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '@$name',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: c.foreground),
            ),
          ),
          AdaptiveButton(
            onPressed: onUnblock,
            label: l.blockedUnblock,
            style: AdaptiveButtonStyle.bordered,
          ),
        ],
      ),
    );
  }
}
