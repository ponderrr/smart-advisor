import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';

/// Dedicated report flow for a post or comment. Replaces the inline
/// confirm dialog from BlockMenuButton — gives the user a reason
/// taxonomy and an optional free-text note, matching how other
/// social apps handle reporting.
///
/// One of [postId] / [commentId] must be set. Route:
///   /feed/report?postId=…    or    /feed/report?commentId=…
class ReportScreen extends ConsumerStatefulWidget {
  const ReportScreen({super.key, this.postId, this.commentId});
  final String? postId;
  final String? commentId;

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

enum _ReportReason {
  spam,
  harassment,
  hate,
  violence,
  sexual,
  misinformation,
  other,
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  _ReportReason? _selected;
  final _details = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  String _reasonLabel(AppLocalizations l, _ReportReason r) => switch (r) {
        _ReportReason.spam => l.reportReasonSpam,
        _ReportReason.harassment => l.reportReasonHarassment,
        _ReportReason.hate => l.reportReasonHate,
        _ReportReason.violence => l.reportReasonViolence,
        _ReportReason.sexual => l.reportReasonSexual,
        _ReportReason.misinformation => l.reportReasonMisinformation,
        _ReportReason.other => l.reportReasonOther,
      };

  /// Stable reason key sent to the backend, independent of locale.
  String _reasonKey(_ReportReason r) => r.name;

  Future<void> _submit(AppLocalizations l) async {
    if (_selected == null || _submitting) return;
    setState(() => _submitting = true);
    final actions = ref.read(feedActionsProvider);
    final detail = _details.text.trim();
    final reason = detail.isEmpty
        ? _reasonKey(_selected!)
        : '${_reasonKey(_selected!)}: $detail';
    try {
      if (widget.postId != null) {
        await actions.reportPost(widget.postId!, reason: reason);
      } else if (widget.commentId != null) {
        await actions.reportComment(widget.commentId!, reason: reason);
      }
      if (!mounted) return;
      showBanner(l.reportThanks, type: AdaptiveSnackBarType.success);
      context.pop();
    } catch (_) {
      if (!mounted) return;
      showBanner(l.reportError, type: AdaptiveSnackBarType.error);
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final isPost = widget.postId != null;
    final title = isPost ? l.reportPostTitle : l.reportCommentTitle;

    return BrandScaffold(
      title: title,
      body: ResponsiveCenter(
        maxWidth: 560,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            BrandHeading(title, size: 22),
            const SizedBox(height: 6),
            Subtitle(l.reportSubheading),
            const SizedBox(height: 16),
            BrandCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final r in _ReportReason.values)
                    _ReasonRow(
                      label: _reasonLabel(l, r),
                      selected: _selected == r,
                      onTap: () => setState(() => _selected = r),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text(l.reportDetailsLabel,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: context.colors.foreground)),
            const SizedBox(height: 6),
            AdaptiveTextField(
              controller: _details,
              placeholder: l.reportDetailsHint,
              minLines: 3,
              maxLines: 6,
            ),
            const SizedBox(height: 22),
            AdaptiveButton(
              onPressed: _selected == null || _submitting
                  ? null
                  : () => _submit(l),
              label: l.reportSubmit,
              color: Tw.rose500,
            ),
          ],
        ),
      ),
    );
  }
}

class _ReasonRow extends StatelessWidget {
  const _ReasonRow({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_off,
              size: 20,
              color: selected ? Tw.rose500 : c.mutedForeground,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: c.foreground)),
            ),
          ],
        ),
      ),
    );
  }
}
