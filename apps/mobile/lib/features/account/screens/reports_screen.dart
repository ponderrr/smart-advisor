import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';
import '../../feed/feed_providers.dart';

/// Settings → Reports. Admin-only triage list of user-filed reports on
/// posts and comments. Visibility is gated by the
/// `feed_reports_select_admin` RLS policy (profiles.is_admin = TRUE) —
/// a non-admin landing here directly would just see an empty list.
class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  late Future<List<_Row>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Row>> _load() async {
    final rows = await ref.read(feedServiceProvider).fetchAllReports();
    return [for (final r in rows) _Row.fromRecord(r)];
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: 'Reports',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: FutureBuilder<List<_Row>>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: LoaderFive('Loading reports')),
                );
              }
              if (snap.hasError) {
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: const [
                    MessageBanner.error(
                        'Couldn’t load reports. Pull down to retry.'),
                  ],
                );
              }
              final rows = snap.data ?? const <_Row>[];
              if (rows.isEmpty) {
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    BrandCard(
                      child: Column(children: [
                        Icon(Icons.flag_outlined,
                            size: 32, color: context.brandMuted),
                        const SizedBox(height: 10),
                        Subtitle('No reports filed yet.', center: true),
                      ]),
                    ),
                  ],
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: rows.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _ReportCard(row: rows[i]),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Row {
  const _Row({
    required this.id,
    required this.reason,
    required this.createdAt,
    required this.reporter,
    required this.isPost,
    required this.targetLabel,
    required this.targetAuthor,
    required this.navPostId,
  });

  factory _Row.fromRecord(
      ({
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
      }) r) {
    // For a comment report we want the back-link to land on the parent
    // post (which holds the threaded discussion the comment lives in).
    final navPostId = r.isPost ? r.postId : r.commentPostId;
    return _Row(
      id: r.id,
      reason: r.reason,
      createdAt: r.createdAt,
      reporter: r.reporter,
      isPost: r.isPost,
      targetLabel: r.targetLabel,
      targetAuthor: r.targetAuthor,
      navPostId: navPostId,
    );
  }

  final String id;
  final String? reason;
  final String createdAt;
  final String? reporter;
  final bool isPost;
  final String? targetLabel;
  final String? targetAuthor;
  final String? navPostId;
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.row});
  final _Row row;

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

  @override
  Widget build(BuildContext context) {
    final navPath = row.navPostId == null ? null : '/feed/${row.navPostId}';
    return BrandCard(
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
          if (navPath != null) ...[
            const SizedBox(height: 10),
            AdaptiveButton(
              onPressed: () => context.push(navPath),
              label: row.isPost ? 'Open post' : 'Open thread',
              style: AdaptiveButtonStyle.bordered,
            ),
          ],
        ],
      ),
    );
  }
}
