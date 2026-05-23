import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';

/// "Reports you've filed" — the post/comment reports the current user
/// submitted, each with its reason and an "Under review" status. Reports
/// are reviewed by staff; there's no user action here beyond seeing them.
class FiledReportsScreen extends ConsumerWidget {
  const FiledReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final reports = ref.watch(myReportsProvider);

    return BrandScaffold(
      title: l.filedReportsTitle,
      body: ResponsiveCenter(
        maxWidth: 560,
        child: reports.when(
          loading: () => Center(child: LoaderFive(l.loading)),
          error: (_, _) => Padding(
            padding: const EdgeInsets.all(20),
            child: MessageBanner.error(l.filedReportsLoadError),
          ),
          data: (list) {
            if (list.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.flag_outlined,
                        size: 48,
                        color: context.colors.mutedForeground),
                    const SizedBox(height: 12),
                    BrandHeading(l.filedReportsEmptyTitle, size: 22),
                    const SizedBox(height: 6),
                    Subtitle(l.filedReportsEmptyBody, center: true),
                  ],
                ),
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: list.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _ReportRow(report: list[i]),
            );
          },
        ),
      ),
    );
  }
}

class _ReportRow extends StatelessWidget {
  const _ReportRow({required this.report});
  final ({
    String id,
    String? reason,
    String createdAt,
    bool isPost,
    String? label,
  }) report;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final c = context.colors;
    final date = DateTime.tryParse(report.createdAt);
    return BrandCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(Icons.flag_outlined,
                      size: 12, color: context.brandMuted),
                  const SizedBox(width: 4),
                  Text(
                    '${report.isPost ? l.filedReportsOnPost : l.filedReportsOnComment}'
                    '${date != null ? ' · ${date.month}/${date.day}/${date.year}' : ''}',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: context.brandMuted),
                  ),
                ]),
                const SizedBox(height: 2),
                Text(
                  report.label ?? l.filedReportsContentRemoved,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: c.foreground),
                ),
                if (report.reason != null &&
                    report.reason!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text('“${report.reason}”',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Tw.amber500.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(l.filedReportsUnderReview,
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Tw.amber500)),
          ),
        ],
      ),
    );
  }
}
