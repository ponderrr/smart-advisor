import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../services/watchlist_import.dart';

/// Bulk-import a Letterboxd (films) or Goodreads (books) CSV export.
/// Each row is run through the existing `library_service.log`, which
/// upserts on (user, medium, lower(title)) — so re-importing is
/// naturally idempotent. Music has no standard export (out of scope).
class ImportScreen extends ConsumerStatefulWidget {
  const ImportScreen({super.key});

  @override
  ConsumerState<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends ConsumerState<ImportScreen> {
  ImportSource _source = ImportSource.letterboxd;
  String? _fileName;
  List<LogLibraryInput>? _parsed;
  String? _error;
  bool _running = false;
  int _done = 0;
  ImportResult? _result;

  Future<void> _pick() async {
    final picked = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['csv'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty) return;
    final file = picked.files.first;
    final bytes = file.bytes;
    if (bytes == null) {
      setState(() {
        _error = 'Couldn’t read that file. Please try again.';
        _parsed = null;
        _result = null;
        _fileName = file.name;
      });
      return;
    }
    String text;
    try {
      text = utf8.decode(bytes, allowMalformed: true);
    } catch (_) {
      text = latin1.decode(bytes);
    }
    try {
      final rows = parseCsv(text, _source);
      final detected = detectSource(text);
      setState(() {
        _fileName = file.name;
        _parsed = rows;
        _result = null;
        _done = 0;
        _error = (detected != null && detected != _source)
            ? 'This looks like a '
                '${detected == ImportSource.letterboxd ? 'Letterboxd' : 'Goodreads'} '
                'export but you picked '
                '${_source == ImportSource.letterboxd ? 'Letterboxd' : 'Goodreads'}. '
                'Switch the source above if the count looks wrong.'
            : null;
      });
    } on ImportFormatException catch (e) {
      setState(() {
        _fileName = file.name;
        _parsed = null;
        _result = null;
        _error = e.message;
      });
    }
  }

  Future<void> _import() async {
    final items = _parsed;
    if (items == null || items.isEmpty || _running) return;
    setState(() {
      _running = true;
      _done = 0;
      _result = const ImportResult();
    });
    final svc = ref.read(libraryServiceProvider);
    var res = const ImportResult();
    for (final input in items) {
      if (input.title.trim().isEmpty) {
        res = res.copyWith(skipped: res.skipped + 1);
      } else {
        final r = await svc.log(input);
        res = r.isError
            ? res.copyWith(failed: res.failed + 1)
            : res.copyWith(imported: res.imported + 1);
      }
      if (!mounted) return;
      setState(() {
        _done++;
        _result = res;
      });
    }
    if (!mounted) return;
    setState(() => _running = false);
    showBanner(
      'Imported ${res.imported} of ${items.length} items',
      type: AdaptiveSnackBarType.success,
    );
  }

  @override
  Widget build(BuildContext context) {
    final parsed = _parsed;
    final result = _result;
    return BrandScaffold(
      title: 'Import library',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Bulk import'),
              const SizedBox(height: 6),
              const BrandHeading('Bring your watchlist over',
                  size: 26),
              const SizedBox(height: 8),
              Subtitle('Import a Letterboxd films export or a '
                  'Goodreads books export. Each row becomes a '
                  'library item; re-importing the same title just '
                  'updates it.'),
              const SizedBox(height: 20),
              const Eyebrow('Source'),
              const SizedBox(height: 8),
              BrandSegmented(
                color: _source == ImportSource.letterboxd
                    ? Tw.amber500
                    : Tw.emerald500,
                labels: const ['Letterboxd', 'Goodreads'],
                selectedIndex:
                    _source == ImportSource.letterboxd ? 0 : 1,
                onValueChanged: (i) => setState(() {
                  _source = i == 0
                      ? ImportSource.letterboxd
                      : ImportSource.goodreads;
                  // The mapping is source-specific; force a re-pick so
                  // we never import a parse against the wrong source.
                  _parsed = null;
                  _result = null;
                  _error = null;
                  _fileName = null;
                }),
              ),
              const SizedBox(height: 10),
              Subtitle(_source == ImportSource.letterboxd
                  ? 'Letterboxd → Settings → Import & Export → '
                      'Export your data. Use watchlist.csv or '
                      'ratings.csv from the .zip.'
                  : 'Goodreads → My Books → Import and export → '
                      'Export Library, then upload the .csv.'),
              const SizedBox(height: 20),
              AdaptiveButton(
                onPressed: _running ? null : _pick,
                label: 'Choose CSV file',
                style: AdaptiveButtonStyle.bordered,
              ),
              if (_fileName != null) ...[
                const SizedBox(height: 8),
                Text(_fileName!,
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
              ],
              if (_error != null) ...[
                const SizedBox(height: 16),
                MessageBanner(message: _error!),
              ],
              if (parsed != null) ...[
                const SizedBox(height: 20),
                BrandCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        parsed.isEmpty
                            ? 'No importable rows found in this file.'
                            : 'Found ${parsed.length} '
                                '${parsed.length == 1 ? 'item' : 'items'}.',
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: context.brandInk),
                      ),
                      if (_running) ...[
                        const SizedBox(height: 14),
                        BrandProgressBar(
                          value: parsed.isEmpty
                              ? 0
                              : _done / parsed.length,
                          accent: _source == ImportSource.letterboxd
                              ? ContentAccentName.amber
                              : ContentAccentName.emerald,
                        ),
                        const SizedBox(height: 8),
                        Text('$_done / ${parsed.length}',
                            style: TextStyle(
                                fontSize: 12,
                                color: context.brandMuted)),
                      ],
                      if (result != null && !_running) ...[
                        const SizedBox(height: 12),
                        _summaryRow(context, 'Imported',
                            result.imported, Tw.emerald500),
                        _summaryRow(context, 'Skipped (blank)',
                            result.skipped, Tw.amber500),
                        _summaryRow(context, 'Failed',
                            result.failed, Tw.rose500),
                      ],
                      if (parsed.isNotEmpty &&
                          result == null &&
                          !_running) ...[
                        const SizedBox(height: 16),
                        AdaptiveButton(
                          onPressed: _import,
                          label: 'Import ${parsed.length} '
                              '${parsed.length == 1 ? 'item' : 'items'}',
                        ),
                      ],
                      if (result != null && !_running) ...[
                        const SizedBox(height: 16),
                        AdaptiveButton(
                          onPressed: () => context.pop(),
                          label: 'Done',
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(
      BuildContext context, String label, int n, Color dot) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Container(
          width: 8,
          height: 8,
          decoration:
              BoxDecoration(color: dot, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label,
              style: TextStyle(color: context.brandMuted)),
        ),
        Text('$n',
            style: TextStyle(
                fontWeight: FontWeight.w800,
                color: context.brandInk)),
      ]),
    );
  }
}
