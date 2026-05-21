import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';

/// In-memory new-post composer. Visibility-aware (parity with the web
/// settings + composer copy): when the profile is **private** it shows a
/// lock hint and the success wording becomes "Saved to your picks — not
/// broadcast (private profile)".
class Composer extends ConsumerStatefulWidget {
  const Composer({super.key, required this.initialCommunity});
  final FeedCommunity initialCommunity;

  @override
  ConsumerState<Composer> createState() => _ComposerState();
}

class _ComposerState extends ConsumerState<Composer> {
  static const _maxTitle = 120;
  static const _activities = <(FeedActivity, String)>[
    (FeedActivity.finished, 'Finished'),
    (FeedActivity.rated, 'Rated'),
    (FeedActivity.shared, 'Recommending'),
  ];

  late FeedCommunity _community = widget.initialCommunity;
  FeedActivity _activity = FeedActivity.finished;
  final _title = TextEditingController();
  final _body = TextEditingController();
  final _cover = TextEditingController();
  final _creator = TextEditingController();
  final _year = TextEditingController();

  @override
  void initState() {
    super.initState();
    for (final c in [_title, _cover, _creator]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    for (final c in [_title, _body, _cover, _creator, _year]) {
      c.dispose();
    }
    super.dispose();
  }

  Color get _accent =>
      contentAccent(_community.accent, Theme.of(context).brightness).dot;

  bool get _valid => _title.text.trim().isNotEmpty;

  Future<void> _post() async {
    if (!_valid) return;
    final isPrivate = ref.read(feedVisibilityProvider) ==
        FeedVisibility.private;
    try {
      await ref.read(feedActionsProvider).createPost(
            community: _community,
            title: _title.text.trim(),
            body: _body.text,
            activity: _activity,
            posterUrl: _cover.text,
            creator: _creator.text,
            year: int.tryParse(_year.text.trim()),
          );
    } catch (_) {
      showBanner('Couldn\'t share your pick — please try again.',
          type: AdaptiveSnackBarType.error);
      return;
    }
    if (!mounted) return;
    Navigator.of(context).pop();
    showBanner(
        isPrivate
            ? 'Saved to your picks — not broadcast (private profile)'
            : 'Shared with ${_community.label} friends',
        type: AdaptiveSnackBarType.success,
        duration: const Duration(seconds: 2));
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Align(
            alignment: Alignment.centerLeft, child: Eyebrow(text)),
      );

  @override
  Widget build(BuildContext context) {
    final remaining = _maxTitle - _title.text.characters.length;
    final isPrivate =
        ref.watch(feedVisibilityProvider) == FeedVisibility.private;
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.9),
        padding: EdgeInsets.fromLTRB(
            16, 12, 16, MediaQuery.of(context).padding.bottom + 16),
        decoration: BoxDecoration(
          color: brandBg(Theme.of(context).brightness),
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 44,
            height: 4,
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
                color: context.colors.border,
                borderRadius: BorderRadius.circular(999)),
          ),
          Row(children: [
            const Flexible(
                child: BrandHeading('Share a pick', size: 20)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: _accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999)),
              child: Text(_community.tag,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: _accent)),
            ),
          ]),
          if (isPrivate) ...[
            const SizedBox(height: 10),
            Row(children: [
              Icon(Icons.lock_outline,
                  size: 14, color: context.brandMuted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                    'Your profile is private — this is saved to your '
                    'picks but not broadcast.',
                    style: TextStyle(
                        fontSize: 11.5,
                        height: 1.35,
                        color: context.brandMuted)),
              ),
            ]),
          ],
          const SizedBox(height: 8),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.only(top: 6),
              children: [
                _label('Community'),
                BrandSegmented(
                  color: _accent,
                  labels: const ['Movies', 'Books', 'Music'],
                  selectedIndex: _community.index,
                  onValueChanged: (i) => setState(
                      () => _community = FeedCommunity.values[i]),
                ),
                _label('What did you do?'),
                BrandSegmented(
                  color: _accent,
                  labels: [for (final a in _activities) a.$2],
                  selectedIndex: _activities
                      .indexWhere((a) => a.$1 == _activity),
                  onValueChanged: (i) => setState(
                      () => _activity = _activities[i].$1),
                ),
                _label('Title'),
                AdaptiveTextField(
                  controller: _title,
                  placeholder: 'What did you watch / read / hear?',
                  inputFormatters: [
                    LengthLimitingTextInputFormatter(_maxTitle)
                  ],
                  suffix: Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: Text('$remaining',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: remaining < 0
                                ? Tw.rose500
                                : context.brandMuted)),
                  ),
                ),
                const SizedBox(height: 10),
                AdaptiveTextField(
                  controller: _body,
                  placeholder: 'Your take (optional)',
                  minLines: 3,
                  maxLines: 6,
                ),
                _label('Details (optional)'),
                AdaptiveTextField(
                  controller: _cover,
                  placeholder: 'Cover image URL',
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    flex: 3,
                    child: AdaptiveTextField(
                      controller: _creator,
                      placeholder: 'Creator / artist',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: AdaptiveTextField(
                      controller: _year,
                      placeholder: 'Year',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ]),
                if (_cover.text.trim().isNotEmpty ||
                    _title.text.trim().isNotEmpty) ...[
                  _label('Preview'),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.colors.muted,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: _accent.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        PosterThumb(
                            url: _cover.text.trim(),
                            square:
                                _community == FeedCommunity.music,
                            w: 44,
                            semanticLabel: 'Cover image preview'),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(
                                    bottom: 4),
                                child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(_activity.icon,
                                          size: 11,
                                          color: _accent),
                                      const SizedBox(width: 4),
                                      Text(
                                          'you ${_activity.verb}'
                                              .toUpperCase(),
                                          style: TextStyle(
                                              fontSize: 9,
                                              fontWeight:
                                                  FontWeight.w900,
                                              letterSpacing: 0.5,
                                              color: _accent)),
                                    ]),
                              ),
                              Text(
                                  _title.text.trim().isEmpty
                                      ? 'Your title…'
                                      : _title.text.trim(),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: context.brandInk)),
                              if (_creator.text.trim().isNotEmpty)
                                Text(_creator.text.trim(),
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: context.brandMuted)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: AdaptiveButton(
                    onPressed: _valid ? _post : null,
                    label: isPrivate
                        ? 'Save to your picks'
                        : 'Share with ${_community.label}',
                    color: _accent,
                  ),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}
