import 'package:csv/csv.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';

/// Where the CSV came from. The user picks this explicitly in the UI;
/// [detectSource] is a convenience used only to warn on a likely mismatch.
enum ImportSource { letterboxd, goodreads }

/// Running tally surfaced after an import: rows written, rows that the
/// service rejected (counted as failures — `log` upserts, so it can't
/// signal "this was a duplicate"), and rows skipped before the network
/// (blank title / unparseable).
class ImportResult {
  const ImportResult({
    this.imported = 0,
    this.skipped = 0,
    this.failed = 0,
  });

  final int imported;
  final int skipped;
  final int failed;

  ImportResult copyWith({int? imported, int? skipped, int? failed}) =>
      ImportResult(
        imported: imported ?? this.imported,
        skipped: skipped ?? this.skipped,
        failed: failed ?? this.failed,
      );
}

/// Thrown by [parseCsv] when the file can't be read as the chosen
/// source's export (empty, no header, or the wrong format entirely).
class ImportFormatException implements Exception {
  ImportFormatException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Best-effort source sniff from the header row. Returns null when the
/// headers match neither known export. Letterboxd exports carry a
/// `Letterboxd URI` column; Goodreads carries `Exclusive Shelf` /
/// `Bookshelves`.
ImportSource? detectSource(String csv) {
  final rows = _parse(csv);
  if (rows.isEmpty) return null;
  final headers = rows.first.map((c) => '$c'.trim().toLowerCase()).toSet();
  if (headers.contains('letterboxd uri')) return ImportSource.letterboxd;
  if (headers.contains('exclusive shelf') ||
      headers.contains('bookshelves')) {
    return ImportSource.goodreads;
  }
  return null;
}

/// Parses a Letterboxd or Goodreads CSV export into [LogLibraryInput]s.
///
/// Pure (no Flutter / network): tolerant of column order and missing
/// optional columns, trims every value, skips blank rows and rows with
/// an empty title. Throws [ImportFormatException] on an unusable file.
List<LogLibraryInput> parseCsv(String csv, ImportSource source) {
  final rows = _parse(csv);
  if (rows.isEmpty) {
    throw ImportFormatException('That file looks empty.');
  }
  final header = rows.first.map((c) => '$c'.trim()).toList();
  final lower = header.map((h) => h.toLowerCase()).toList();
  int idx(List<String> names) {
    for (final n in names) {
      final i = lower.indexOf(n.toLowerCase());
      if (i != -1) return i;
    }
    return -1;
  }

  String? cell(List<dynamic> row, int i) {
    if (i < 0 || i >= row.length) return null;
    final v = '${row[i]}'.trim();
    return v.isEmpty ? null : v;
  }

  final out = <LogLibraryInput>[];
  if (source == ImportSource.letterboxd) {
    final nameI = idx(const ['Name']);
    final yearI = idx(const ['Year']);
    final ratingI = idx(const ['Rating']);
    final hasUri = idx(const ['Letterboxd URI']) != -1;
    if (nameI == -1) {
      throw ImportFormatException(
          'This doesn’t look like a Letterboxd export — '
          'no “Name” column was found.');
    }
    final hasRatingCol = ratingI != -1;
    for (final row in rows.skip(1)) {
      if (_isBlank(row)) continue;
      final title = cell(row, nameI);
      if (title == null) continue;
      final stars =
          hasRatingCol ? double.tryParse(cell(row, ratingI) ?? '') : null;
      final LibraryStatus status;
      if (stars != null) {
        status = LibraryStatus.finished;
      } else if (!hasRatingCol && hasUri) {
        // watchlist.csv has no Rating column → these are saved-for-later.
        status = LibraryStatus.wishlist;
      } else {
        status = LibraryStatus.finished;
      }
      out.add(LogLibraryInput(
        medium: LibraryMedium.movie,
        title: title,
        year: int.tryParse(cell(row, yearI) ?? ''),
        status: status,
        rating: stars == null ? null : _toScale(stars),
      ));
    }
  } else {
    final titleI = idx(const ['Title']);
    final authorI = idx(const ['Author']);
    final ratingI = idx(const ['My Rating']);
    final shelfI = idx(const ['Exclusive Shelf']);
    final origYearI = idx(const ['Original Publication Year']);
    final pubYearI = idx(const ['Year Published']);
    if (titleI == -1) {
      throw ImportFormatException(
          'This doesn’t look like a Goodreads export — '
          'no “Title” column was found.');
    }
    for (final row in rows.skip(1)) {
      if (_isBlank(row)) continue;
      final raw = cell(row, titleI);
      if (raw == null) continue;
      final title = _stripSeries(raw);
      final shelf = (cell(row, shelfI) ?? '').toLowerCase();
      final status = switch (shelf) {
        'currently-reading' => LibraryStatus.inProgress,
        'to-read' => LibraryStatus.wishlist,
        'read' => LibraryStatus.finished,
        _ => LibraryStatus.finished,
      };
      final stars = double.tryParse(cell(row, ratingI) ?? '');
      out.add(LogLibraryInput(
        medium: LibraryMedium.book,
        title: title,
        creator: cell(row, authorI),
        year: int.tryParse(cell(row, origYearI) ?? '') ??
            int.tryParse(cell(row, pubYearI) ?? ''),
        status: status,
        rating: (stars == null || stars <= 0) ? null : _toScale(stars),
      ));
    }
  }
  return out;
}

/// Star rating (0.5–5) → the library's 1–3 scale: >=4 ⇒ 3 (loved),
/// 2.5–3.5 ⇒ 2 (meh), else ⇒ 1 (nope).
int _toScale(double stars) {
  if (stars >= 4) return 3;
  if (stars >= 2.5 && stars <= 3.5) return 2;
  return 1;
}

/// Drops a trailing " (Series, #n)" Goodreads appends to some titles.
String _stripSeries(String t) =>
    t.replaceAll(RegExp(r'\s*\([^()]*,\s*#\d+(\.\d+)?\)\s*$'), '').trim();

bool _isBlank(List<dynamic> row) =>
    row.every((c) => '$c'.trim().isEmpty);

List<List<dynamic>> _parse(String csv) {
  if (csv.trim().isEmpty) return const [];
  return const CsvToListConverter(
    eol: '\n',
    shouldParseNumbers: false,
  ).convert(csv.replaceAll('\r\n', '\n').replaceAll('\r', '\n'));
}
