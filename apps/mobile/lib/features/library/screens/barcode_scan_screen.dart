import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../recommendations/services/open_library_service.dart';

/// Full-screen camera that scans book barcodes (EAN-13 / ISBN-13)
/// and adds the resolved book to the user's library. One-shot: the
/// first valid ISBN-13 we detect freezes the scanner, runs Open
/// Library lookup, and presents a confirm sheet — accept inserts via
/// LibraryService.log; cancel resumes scanning.
///
/// Only ISBNs are accepted (EAN-13 starting with 978/979). Any other
/// barcode the camera sees is ignored so the user doesn't accidentally
/// "add" a cereal box to their library.
class BarcodeScanScreen extends ConsumerStatefulWidget {
  const BarcodeScanScreen({super.key});

  @override
  ConsumerState<BarcodeScanScreen> createState() =>
      _BarcodeScanScreenState();
}

class _BarcodeScanScreenState extends ConsumerState<BarcodeScanScreen> {
  final _controller = MobileScannerController(
    formats: const [BarcodeFormat.ean13],
    detectionSpeed: DetectionSpeed.normal,
  );
  bool _busy = false;
  String? _lastIsbn;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture cap) async {
    if (_busy) return;
    for (final b in cap.barcodes) {
      final raw = b.rawValue?.trim();
      if (raw == null) continue;
      // ISBN-13 prefix gate — book barcodes start 978 or 979.
      if (raw.length != 13 || !(raw.startsWith('978') || raw.startsWith('979'))) {
        continue;
      }
      if (raw == _lastIsbn) return; // ignore the same code mid-debounce
      _lastIsbn = raw;
      setState(() => _busy = true);
      Haptics.selection();
      await _resolveAndConfirm(raw);
      return;
    }
  }

  Future<void> _resolveAndConfirm(String isbn) async {
    final book = await OpenLibraryService().lookupIsbn(isbn);
    if (!mounted) return;
    if (book == null) {
      showBanner('No book found for $isbn',
          type: AdaptiveSnackBarType.error,
          duration: const Duration(seconds: 2));
      setState(() => _busy = false);
      // Allow the same code again after a brief cool-down.
      Future.delayed(const Duration(seconds: 2), () => _lastIsbn = null);
      return;
    }
    await _controller.stop();
    if (!mounted) return;
    final shouldAdd = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _ConfirmSheet(book: book),
    );
    if (!mounted) {
      return;
    }
    if (shouldAdd == true) {
      final svc = ref.read(libraryServiceProvider);
      final res = await svc.log(LogLibraryInput(
        medium: LibraryMedium.book,
        title: book.title,
        creator: book.author,
        year: book.year,
        posterUrl: book.cover,
        status: LibraryStatus.wishlist,
      ));
      if (!mounted) return;
      if (!res.isError) {
        showBanner('Added "${book.title}"',
            type: AdaptiveSnackBarType.success,
            duration: const Duration(seconds: 2));
        if (context.canPop()) context.pop();
        return;
      }
      showBanner('Couldn\'t add — ${res.error ?? "try again"}',
          type: AdaptiveSnackBarType.error);
    }
    // Either user cancelled or the insert failed — resume scanning.
    await _controller.start();
    if (!mounted) return;
    setState(() => _busy = false);
    _lastIsbn = null;
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: 'Scan a book',
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) => _ErrorView(error: error),
          ),
          // Translucent overlay with a centered scan window — keeps
          // the user oriented and tells them where to point the
          // camera (book covers are wide).
          IgnorePointer(
            child: Center(
              child: Container(
                width: 280,
                height: 160,
                decoration: BoxDecoration(
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.85), width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 36,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  _busy
                      ? 'Looking up book…'
                      : 'Point at the barcode on the back cover',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConfirmSheet extends StatelessWidget {
  const _ConfirmSheet({required this.book});
  final BookIsbnResult book;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: brandBg(Theme.of(context).brightness),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (book.cover != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(book.cover!,
                        width: 60, height: 90, fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const SizedBox(width: 60, height: 90)),
                  )
                else
                  Container(
                    width: 60,
                    height: 90,
                    decoration: BoxDecoration(
                      color: context.colors.muted,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.menu_book_outlined,
                        color: context.brandMuted),
                  ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(book.title,
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: context.brandInk)),
                      if (book.author != null) ...[
                        const SizedBox(height: 4),
                        Text(book.author!,
                            style: TextStyle(
                                fontSize: 13, color: context.brandMuted)),
                      ],
                      if (book.year != null) ...[
                        const SizedBox(height: 2),
                        Text('${book.year}',
                            style: TextStyle(
                                fontSize: 12, color: context.brandMuted)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: AdaptiveButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  label: 'Cancel',
                  style: AdaptiveButtonStyle.plain,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: AdaptiveButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  label: 'Add to library',
                  color: Tw.violet500,
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error});
  final MobileScannerException error;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.no_photography_outlined,
                size: 44, color: context.brandMuted),
            const SizedBox(height: 12),
            BrandHeading("Camera unavailable", size: 18),
            const SizedBox(height: 6),
            Subtitle(
                'Grant camera permission in your phone settings and reopen.',
                center: true),
          ],
        ),
      ),
    );
  }
}
