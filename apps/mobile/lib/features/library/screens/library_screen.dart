import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../notifications/notification_service.dart';

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
  ViewMode _view = ViewMode.list;

  @override
  Widget build(BuildContext context) {
    // Keep the "finish what you started" reminder accurate whenever the
    // library (re)loads — including after a status edit invalidates it.
    ref.listen(_libraryProvider, (_, next) {
      next.whenData((items) =>
          ref.read(remindersProvider.notifier).syncInProgress(items));
    });
    final lib = ref.watch(_libraryProvider);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        Row(children: [
          const Expanded(
              child: BrandHeading('Logged & saved', size: 32)),
          _ImportButton(onTap: () => context.push('/library/import')),
          if (lib.asData?.value.isNotEmpty ?? false) ...[
            const SizedBox(width: 8),
            ClearAllButton(
              title: 'Clear your library?',
              message: 'Every logged & saved item will be '
                  'permanently removed. This can’t be undone.',
              onConfirm: _clearAll,
            ),
          ],
        ]),
        const SizedBox(height: 16),
        _filters(),
        const SizedBox(height: 16),
        lib.when(
          loading: () => const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: LoaderFive('Loading'))),
          error: (e, _) => const MessageBanner.error(
              'We couldn’t load your library right now. '
              'Please try again in a moment.'),
          data: (items) {
            final filtered = items.where((i) {
              if (_medium != null && i.medium != _medium) return false;
              if (_status != null && i.status != _status) return false;
              return true;
            }).toList();
            if (filtered.isEmpty) {
              return Subtitle('Nothing here yet.');
            }
            if (_view == ViewMode.grid) {
              return LayoutBuilder(builder: (_, box) {
                const gap = 12.0;
                final cellW = (box.maxWidth - gap) / 2;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (final i in filtered)
                      _gridCard(i, cellW),
                  ],
                );
              });
            }
            return Column(children: [
              for (final i in filtered)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _row(i),
                ),
            ]);
          },
        ),
      ],
    );
  }

  /// Content-type accent so library cards carry the same
  /// movie=amber / book=emerald / music=rose tint as the feed cards.
  static ContentAccentName _accentFor(LibraryMedium m) => switch (m) {
        LibraryMedium.movie => ContentAccentName.amber,
        LibraryMedium.book => ContentAccentName.emerald,
        LibraryMedium.music => ContentAccentName.rose,
      };

  Widget _gridCard(LibraryItem i, double w) {
    return SizedBox(
      width: w,
      child: BrandCard(
        accent: _accentFor(i.medium),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: PosterThumb(
                  url: i.posterUrl,
                  square: i.medium == LibraryMedium.music,
                  w: w - 20,
                  semanticLabel: '${i.title} cover',
                ),
              ),
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: _menu(i, Colors.white),
                ),
              ),
            ]),
            const SizedBox(height: 8),
            Text(i.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: context.brandInk)),
            const SizedBox(height: 2),
            Text(
                '${i.creator ?? ''}${i.year != null ? ' · ${i.year}' : ''} · ${i.status.wire}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontSize: 12, color: context.brandMuted)),
          ],
        ),
      ),
    );
  }

  Widget _menu(LibraryItem i, Color iconColor) {
    return Semantics(
      button: true,
      label: 'More options for “${i.title}”',
      child: AdaptivePopupMenuButton.icon<String>(
      icon: Icons.more_vert,
      tint: iconColor,
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
    );
  }

  /// Web-parity status colors: All→indigo, Finished→emerald,
  /// In progress→amber, Wishlist→violet, Dropped→rose.
  Color _statusColor(int idx) => switch (idx) {
        1 => Tw.emerald500,
        2 => Tw.amber500,
        3 => Tw.violet500,
        4 => Tw.rose500,
        _ => Tw.indigo500,
      };

  String _statusLabel(LibraryStatus s) => switch (s) {
        LibraryStatus.finished => 'Finished',
        LibraryStatus.inProgress => 'In progress',
        LibraryStatus.wishlist => 'Wishlist',
        LibraryStatus.dropped => 'Dropped',
      };

  Widget _filters() {
    final mediumIdx = _medium == null ? 0 : _medium!.index + 1;
    final statusIdx = _status == null ? 0 : _status!.index + 1;
    return Column(children: [
      Row(children: [
        Expanded(
          child: BrandSegmented(
            color: accentColorForLabel(
                const ['All', 'Movie', 'Book', 'Music'][mediumIdx]),
            labels: const ['All', 'Movie', 'Book', 'Music'],
            selectedIndex: mediumIdx,
            onValueChanged: (i) => setState(() =>
                _medium = i == 0 ? null : LibraryMedium.values[i - 1]),
          ),
        ),
        const SizedBox(width: 8),
        ViewModeToggle(
          value: _view,
          onChanged: (v) => setState(() => _view = v),
        ),
      ]),
      const SizedBox(height: 8),
      BrandSegmented(
        color: _statusColor(statusIdx),
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
      accent: _accentFor(i.medium),
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        PosterThumb(
            url: i.posterUrl,
            square: i.medium == LibraryMedium.music,
            semanticLabel: '${i.title} cover'),
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
        _menu(i, context.brandMuted),
      ]),
    );
  }

  Future<void> _clearAll() async {
    final res = await ref.read(libraryServiceProvider).clearAll();
    ref.invalidate(_libraryProvider);
    showBanner(
      res.error == null
          ? 'Library cleared'
          : 'Could not clear library: ${res.error}',
      type: res.error == null
          ? AdaptiveSnackBarType.success
          : AdaptiveSnackBarType.error,
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
      final next = LibraryStatus.values.firstWhere((s) => s.wire == v);
      await svc.update(i.id, UpdateLibraryInput(status: next));
      showBanner('“${i.title}” → ${_statusLabel(next)}',
          type: AdaptiveSnackBarType.success,
          duration: const Duration(seconds: 2));
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

/// Compact "Import" pill for the Library header — same shape as
/// [ClearAllButton] but non-destructive (indigo), pushes the CSV
/// import flow.
class _ImportButton extends StatelessWidget {
  const _ImportButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Tw.indigo500.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border:
              Border.all(color: Tw.indigo500.withValues(alpha: 0.4)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: const [
          Icon(Icons.file_upload_outlined,
              size: 16, color: Tw.indigo500),
          SizedBox(width: 6),
          Text('Import',
              style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: Tw.indigo500)),
        ]),
      ),
    );
  }
}
