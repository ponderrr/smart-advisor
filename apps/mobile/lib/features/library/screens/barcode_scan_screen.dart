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
  // Filled in after the camera initialises; renders the lens-cycle
  // button only when the phone exposes more than one back lens
  // (single-lens phones get a less cluttered UI).
  List<CameraLensType> _availableLenses = const [];

  @override
  void initState() {
    super.initState();
    // getSupportedLenses() needs the camera to be running; wait one
    // frame so the controller has a chance to start before we query.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        final lenses = await _controller.getSupportedLenses();
        if (!mounted) return;
        setState(() =>
            _availableLenses =
                lenses.where((l) => l != CameraLensType.any).toList());
      } catch (_) {
        // Plugin may throw if called before the controller is fully
        // ready — leave the list empty and just hide the button.
      }
    });
  }

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
          // Top-right control strip: torch + lens cycle + camera flip.
          // Driven off the controller's own ValueNotifier so the torch
          // icon stays in sync if the OS auto-disables it (low battery,
          // thermal, etc). The lens-cycle button only renders when the
          // phone has 2+ back lenses to cycle through.
          Positioned(
            top: 12,
            right: 12,
            child: ValueListenableBuilder<MobileScannerState>(
              valueListenable: _controller,
              builder: (_, state, _) {
                final showLens = _availableLenses.length >= 2;
                return Row(mainAxisSize: MainAxisSize.min, children: [
                  _ScannerIconButton(
                    icon: state.torchState == TorchState.on
                        ? Icons.flash_on_rounded
                        : Icons.flash_off_rounded,
                    tooltip: 'Toggle flashlight',
                    onTap: () {
                      Haptics.selection();
                      _controller.toggleTorch();
                    },
                  ),
                  if (showLens) ...[
                    const SizedBox(width: 8),
                    _ScannerIconButton(
                      icon: _iconForLens(state.cameraLensType),
                      // Picker order matches the controller's internal
                      // cycle (normal → wide → zoom → normal).
                      tooltip: _tooltipForLens(state.cameraLensType),
                      onTap: () {
                        Haptics.selection();
                        _controller.switchCamera(const ToggleLensType());
                      },
                    ),
                  ],
                  const SizedBox(width: 8),
                  _ScannerIconButton(
                    icon: Icons.cameraswitch_rounded,
                    tooltip: 'Switch camera',
                    onTap: () {
                      Haptics.selection();
                      _controller.switchCamera();
                    },
                  ),
                ]);
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Icon picked to read at-a-glance which lens is currently active.
/// Matches the controller's normal → wide → zoom cycle.
IconData _iconForLens(CameraLensType lens) => switch (lens) {
      CameraLensType.wide => Icons.panorama_wide_angle_outlined,
      CameraLensType.zoom => Icons.zoom_in_rounded,
      CameraLensType.normal => Icons.camera_outlined,
      CameraLensType.any => Icons.camera_outlined,
    };

String _tooltipForLens(CameraLensType lens) {
  final current = switch (lens) {
    CameraLensType.wide => 'wide',
    CameraLensType.zoom => 'zoom',
    CameraLensType.normal => 'normal',
    CameraLensType.any => 'lens',
  };
  return 'Cycle lens (now: $current)';
}

/// Round translucent-black icon button used for the in-scanner
/// torch and camera-flip controls. Same visual weight as the bottom
/// hint pill so they don't fight for attention.
class _ScannerIconButton extends StatelessWidget {
  const _ScannerIconButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 20, color: Colors.white),
          ),
        ),
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
