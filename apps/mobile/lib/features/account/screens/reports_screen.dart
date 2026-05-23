import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../feed/feed_providers.dart';
import '../../feed/screens/filed_reports_screen.dart' show ReportStatusBadge;

typedef _Report = ({
  String id,
  String? reason,
  String createdAt,
  String? reporter,
  bool isPost,
  String? targetLabel,
  String? targetAuthor,
  String? postId,
  String? commentId,
  String? commentPostId,
  String status,
});

/// Backs the admin Reports list — kept inside this file rather than in
/// `feed_providers.dart` because it's only used here and pulling the
/// full record-type into the shared providers file would force every
/// consumer to recompile.
final _allReportsProvider = FutureProvider.autoDispose<List<_Report>>(
    (ref) => ref.watch(feedServiceProvider).fetchAllReports());

enum _Filter { open, resolved, all }

class _FilterNotifier extends Notifier<_Filter> {
  @override
  _Filter build() => _Filter.open;
  void set(_Filter f) => state = f;
}

final _filterProvider =
    NotifierProvider<_FilterNotifier, _Filter>(_FilterNotifier.new);

/// Settings → Reports. Admin-only triage list of user-filed reports on
/// posts and comments. Visibility is gated by the
/// `feed_reports_select_admin` RLS policy (profiles.is_admin = TRUE) —
/// a non-admin landing here directly would just see an empty list.
/// Admins can mark a report as reviewed (action taken) or dismissed
/// (no action needed); both are gated server-side by
/// `feed_reports_update_admin`.
class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(_filterProvider);
    final reports = ref.watch(_allReportsProvider);
    return BrandScaffold(
      title: 'Reports',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(_allReportsProvider),
          child: reports.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: LoaderFive('Loading reports')),
            ),
            error: (_, _) => ListView(
              padding: const EdgeInsets.all(20),
              children: const [
                MessageBanner.error(
                    'Couldn’t load reports. Pull down to retry.'),
              ],
            ),
            data: (rows) {
              bool keep(_Report r) => switch (filter) {
                    _Filter.open => r.status == 'open',
                    _Filter.resolved => r.status != 'open',
                    _Filter.all => true,
                  };
              final filtered = [for (final r in rows) if (keep(r)) r];
              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _FilterBar(
                    selected: filter,
                    counts: _counts(rows),
                    onSelected: (f) =>
                        ref.read(_filterProvider.notifier).set(f),
                  ),
                  const SizedBox(height: 14),
                  if (filtered.isEmpty)
                    BrandCard(
                      child: Column(children: [
                        Icon(Icons.flag_outlined,
                            size: 32, color: context.brandMuted),
                        const SizedBox(height: 10),
                        Subtitle(
                            filter == _Filter.open
                                ? 'No open reports.'
                                : 'No reports here.',
                            center: true),
                      ]),
                    )
                  else
                    for (int i = 0; i < filtered.length; i++) ...[
                      _ReportCard(row: filtered[i]),
                      if (i < filtered.length - 1)
                        const SizedBox(height: 10),
                    ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  ({int open, int resolved, int all}) _counts(List<_Report> rows) {
    var open = 0;
    var resolved = 0;
    for (final r in rows) {
      if (r.status == 'open') {
        open++;
      } else {
        resolved++;
      }
    }
    return (open: open, resolved: resolved, all: rows.length);
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.selected,
    required this.counts,
    required this.onSelected,
  });
  final _Filter selected;
  final ({int open, int resolved, int all}) counts;
  final ValueChanged<_Filter> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: [
        _chip(context, _Filter.open, 'Open · ${counts.open}'),
        _chip(context, _Filter.resolved, 'Resolved · ${counts.resolved}'),
        _chip(context, _Filter.all, 'All · ${counts.all}'),
      ],
    );
  }

  Widget _chip(BuildContext context, _Filter value, String label) {
    final active = selected == value;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => onSelected(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: active
              ? Tw.violet500.withValues(alpha: 0.14)
              : context.colors.muted,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color:
                  active ? Tw.violet500 : context.colors.border),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: active ? Tw.violet500 : context.brandInk)),
      ),
    );
  }
}

class _ReportCard extends ConsumerWidget {
  const _ReportCard({required this.row});
  final _Report row;

  String _ago() {
    final then = DateTime.tryParse(row.createdAt);
    if (then == null) return '';
    final d = DateTime.now().difference(then);
    if (d.inMinutes < 1) return 'just now';
    if (d.inHours < 1) return '${d.inMinutes}m ago';
    if (d.inDays < 1) return '${d.inHours}h ago';
    if (d.inDays < 30) return '${d.inDays}d ago';
    return '${(d.inDays / 30).floor()}mo ago';
  }

  Future<void> _setStatus(
      BuildContext context, WidgetRef ref, String status) async {
    try {
      await ref
          .read(feedActionsProvider)
          .setReportStatus(row.id, status);
      ref.invalidate(_allReportsProvider);
      if (!context.mounted) return;
      showBanner(
          status == 'reviewed'
              ? 'Marked reviewed'
              : status == 'dismissed'
                  ? 'Dismissed'
                  : 'Reopened',
          type: AdaptiveSnackBarType.success);
    } catch (_) {
      if (!context.mounted) return;
      showBanner("Couldn't update report status",
          type: AdaptiveSnackBarType.error);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navPath = row.isPost
        ? (row.postId != null ? '/feed/${row.postId}' : null)
        : (row.commentPostId != null
            ? '/feed/${row.commentPostId}'
            : null);
    final resolved = row.status != 'open';
    return Opacity(
      opacity: resolved ? 0.65 : 1.0,
      child: BrandCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (row.isPost ? Tw.amber500 : Tw.violet500)
                      .withValues(alpha: .14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  row.isPost ? 'POST' : 'COMMENT',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                    color: row.isPost ? Tw.amber500 : Tw.violet500,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ReportStatusBadge(status: row.status),
              const Spacer(),
              Text(_ago(),
                  style: TextStyle(
                      fontSize: 12, color: context.brandMuted)),
            ]),
            const SizedBox(height: 10),
            Text(
              row.targetLabel?.trim().isNotEmpty == true
                  ? row.targetLabel!.trim()
                  : '(deleted)',
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  height: 1.3,
                  color: context.brandInk),
            ),
            if (row.targetAuthor != null) ...[
              const SizedBox(height: 4),
              Text('by @${row.targetAuthor}',
                  style: TextStyle(
                      fontSize: 12, color: context.brandMuted)),
            ],
            const SizedBox(height: 10),
            Row(children: [
              Icon(Icons.flag_outlined,
                  size: 14, color: context.brandMuted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  row.reason?.isNotEmpty == true ? row.reason! : 'no reason',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.brandInk),
                ),
              ),
              if (row.reporter != null)
                Text('— @${row.reporter}',
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              if (navPath != null)
                Expanded(
                  child: AdaptiveButton(
                    onPressed: () => context.push(navPath),
                    label: row.isPost ? 'Open post' : 'Open thread',
                    style: AdaptiveButtonStyle.bordered,
                  ),
                ),
              if (navPath != null) const SizedBox(width: 8),
              if (row.status == 'open') ...[
                AdaptiveButton(
                  onPressed: () => _setStatus(context, ref, 'reviewed'),
                  label: 'Reviewed',
                  color: Tw.emerald500,
                ),
                const SizedBox(width: 8),
                AdaptiveButton(
                  onPressed: () => _setStatus(context, ref, 'dismissed'),
                  label: 'Dismiss',
                  style: AdaptiveButtonStyle.plain,
                ),
              ] else
                AdaptiveButton(
                  onPressed: () => _setStatus(context, ref, 'open'),
                  label: 'Reopen',
                  style: AdaptiveButtonStyle.plain,
                ),
            ]),
          ],
        ),
      ),
    );
  }
}
