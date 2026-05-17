import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';

final _libraryProvider =
    FutureProvider.autoDispose<List<LibraryItem>>((ref) async {
  final res = await ref.watch(libraryServiceProvider).list();
  return res.data ?? const [];
});

/// Port of web /library: medium + status filters, per-item status change,
/// rating/reaction edit, remove.
class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  LibraryMedium? _medium;
  LibraryStatus? _status;

  @override
  Widget build(BuildContext context) {
    final lib = ref.watch(_libraryProvider);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const Eyebrow('Library'),
        const SizedBox(height: 4),
        const BrandHeading('Logged & saved', size: 24),
        const SizedBox(height: 16),
        _filters(),
        const SizedBox(height: 16),
        lib.when(
          loading: () => const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: LoaderFive('Loading'))),
          error: (e, _) => Subtitle('Could not load: $e'),
          data: (items) {
            final filtered = items.where((i) {
              if (_medium != null && i.medium != _medium) return false;
              if (_status != null && i.status != _status) return false;
              return true;
            }).toList();
            if (filtered.isEmpty) {
              return Subtitle('Nothing here yet.');
            }
            return Column(
                children: [for (final i in filtered) _row(i)]);
          },
        ),
      ],
    );
  }

  Widget _filters() {
    final mediumIdx = _medium == null ? 0 : _medium!.index + 1;
    final statusIdx = _status == null ? 0 : _status!.index + 1;
    return Column(children: [
      BrandSegmented(
        color: accentColorForLabel(
            const ['All', 'Movie', 'Book', 'Music'][mediumIdx]),
        labels: const ['All', 'Movie', 'Book', 'Music'],
        selectedIndex: mediumIdx,
        onValueChanged: (i) => setState(() =>
            _medium = i == 0 ? null : LibraryMedium.values[i - 1]),
      ),
      const SizedBox(height: 8),
      BrandSegmented(
            color: Tw.indigo500,
        labels: const ['All', 'Finished', 'In progress', 'Wishlist',
            'Dropped'],
        selectedIndex: statusIdx,
        onValueChanged: (i) => setState(() =>
            _status = i == 0 ? null : LibraryStatus.values[i - 1]),
      ),
    ]);
  }

  Widget _row(LibraryItem i) {
    return BrandCard(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        PosterThumb(
            url: i.posterUrl, square: i.medium == LibraryMedium.music),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(i.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: context.brandInk)),
              Text(
                  '${i.creator ?? ''}${i.year != null ? ' · ${i.year}' : ''} · ${i.status.wire}',
                  style: TextStyle(
                      fontSize: 12, color: context.brandMuted)),
              if (i.reaction != null && i.reaction!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('“${i.reaction}”',
                      style: TextStyle(
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                          color: context.brandMuted)),
                ),
            ],
          ),
        ),
        AdaptivePopupMenuButton.icon<String>(
          icon: Icons.more_vert,
          onSelected: (_, entry) {
            if (entry.value != null) _action(i, entry.value!);
          },
          items: const [
            AdaptivePopupMenuItem(
                label: 'Finished',
                value: 'finished',
                icon: Icons.check_circle_outline),
            AdaptivePopupMenuItem(
                label: 'In progress',
                value: 'in_progress',
                icon: Icons.timelapse),
            AdaptivePopupMenuItem(
                label: 'Wishlist',
                value: 'wishlist',
                icon: Icons.bookmark_border),
            AdaptivePopupMenuItem(
                label: 'Dropped',
                value: 'dropped',
                icon: Icons.do_not_disturb_alt),
            AdaptivePopupMenuDivider(),
            AdaptivePopupMenuItem(
                label: 'Edit rating', value: 'edit', icon: Icons.star_border),
            AdaptivePopupMenuItem(
                label: 'Remove', value: 'remove', icon: Icons.delete_outline),
          ],
        ),
      ]),
    );
  }

  Future<void> _action(LibraryItem i, String v) async {
    final svc = ref.read(libraryServiceProvider);
    if (v == 'remove') {
      await AdaptiveAlertDialog.show(
        context: context,
        title: 'Remove from library?',
        message: '“${i.title}” will be removed.',
        icon: Icons.delete_outline,
        actions: [
          AlertAction(
              title: 'Cancel',
              style: AlertActionStyle.cancel,
              onPressed: () {}),
          AlertAction(
            title: 'Remove',
            style: AlertActionStyle.destructive,
            onPressed: () async {
              await svc.remove(i.id);
              ref.invalidate(_libraryProvider);
              showBanner('“${i.title}” removed',
                  type: AdaptiveSnackBarType.warning,
                  action: 'Undo', onAction: () async {
                await svc.log(LogLibraryInput(
                  medium: i.medium,
                  title: i.title,
                  creator: i.creator,
                  year: i.year,
                  posterUrl: i.posterUrl,
                  status: i.status,
                  rating: i.rating,
                  reaction: i.reaction,
                  sourceRecommendationId: i.sourceRecommendationId,
                ));
                ref.invalidate(_libraryProvider);
              });
            },
          ),
        ],
      );
    } else if (v == 'edit') {
      await _editDialog(i);
    } else {
      await svc.update(
          i.id,
          UpdateLibraryInput(
              status: LibraryStatus.values
                  .firstWhere((s) => s.wire == v)));
    }
    ref.invalidate(_libraryProvider);
  }

  Future<void> _editDialog(LibraryItem i) async {
    final reaction = TextEditingController(text: i.reaction ?? '');
    var rating = i.rating ?? 2;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (_, setSB) => Container(
          padding: EdgeInsets.fromLTRB(
              20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          decoration: BoxDecoration(
            color: brandBg(Theme.of(ctx).brightness),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                  color: ctx.colors.border,
                  borderRadius: BorderRadius.circular(999)),
            ),
            Align(
                alignment: Alignment.centerLeft,
                child: BrandHeading(i.title, size: 20)),
            const SizedBox(height: 16),
            const Align(
                alignment: Alignment.centerLeft,
                child: Eyebrow('Rating')),
            const SizedBox(height: 8),
            BrandSegmented(
              color: Tw.indigo500,
              labels: const ['👎  Nope', '😐  Meh', '👍  Loved'],
              selectedIndex: rating - 1,
              onValueChanged: (idx) => setSB(() => rating = idx + 1),
            ),
            const SizedBox(height: 16),
            const Align(
                alignment: Alignment.centerLeft,
                child: Eyebrow('Reaction')),
            const SizedBox(height: 8),
            AdaptiveTextField(
                controller: reaction, placeholder: 'One-line reaction'),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(
                child: AdaptiveButton(
                    onPressed: () => Navigator.pop(ctx),
                    label: 'Cancel',
                    style: AdaptiveButtonStyle.bordered),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: AdaptiveButton(
                  onPressed: () async {
                    await ref.read(libraryServiceProvider).update(
                        i.id,
                        UpdateLibraryInput(
                            rating: rating,
                            reaction: reaction.text.trim()));
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  label: 'Save',
                ),
              ),
            ]),
          ]),
        ),
      ),
    );
    reaction.dispose();
  }
}
