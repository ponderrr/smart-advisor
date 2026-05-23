import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/feed_avatar.dart';

/// Blocked-people management. Lists the in-memory blocked-handles set
/// from [blockedProvider] with an inline unblock action; reads as
/// "Settings → Feed → Blocked people". The feed-side block action lives
/// on each PostCard's three-dot menu and writes to the same provider.
class BlockedPeopleScreen extends ConsumerWidget {
  const BlockedPeopleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
            final sorted = [...people]
              ..sort((a, b) => a.name.compareTo(b.name));
            if (sorted.isEmpty) {
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
            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: sorted.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final person = sorted[i];
                return _BlockedRow(
                  name: person.name,
                  avatarUrl: person.avatarUrl,
                  onUnblock: () {
                    ref
                        .read(feedActionsProvider)
                        .unblock(person.id);
                    showBanner(l.blockedUnblockedToast(person.name));
                  },
                );
              },
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
