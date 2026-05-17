import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../auth/services/mfa_service.dart';

/// Port of web /account/mfa-setup (client MFA path): enroll → show QR +
/// secret → verify 6-digit code. Backup-codes step is deferred (backup
/// service not yet ported).
class MfaSetupScreen extends ConsumerStatefulWidget {
  const MfaSetupScreen({super.key});

  @override
  ConsumerState<MfaSetupScreen> createState() => _MfaSetupScreenState();
}

class _MfaSetupScreenState extends ConsumerState<MfaSetupScreen> {
  MfaEnrollment? _enroll;
  final _code = TextEditingController();
  String? _error;
  bool _busy = false;
  bool _done = false;
  List<String>? _backupCodes;

  Future<void> _genBackupCodes() async {
    setState(() => _busy = true);
    final r = await ref.read(backupServiceProvider).generateBackupCodes();
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (r.error == null) {
        _backupCodes = r.codes;
      } else {
        _error = r.error;
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final r = await ref.read(mfaServiceProvider).enroll();
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (r.isError) {
        _error = r.error;
      } else {
        _enroll = r.data;
      }
    });
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final r = await ref
        .read(mfaServiceProvider)
        .verify(_enroll!.factorId, _code.text.trim());
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (r.isError) {
        _error = r.error;
      } else {
        _done = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: 'Two-factor setup',
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (_done) ...[
            const Icon(Icons.check_circle, color: Tw.emerald500, size: 48),
            const SizedBox(height: 12),
            const BrandHeading('Two-factor is on', size: 22),
            const SizedBox(height: 8),
            Subtitle(
                'Your authenticator app will now be required at sign-in.'),
            const SizedBox(height: 20),
            if (_backupCodes == null)
              AdaptiveButton(
                  onPressed: _busy ? null : _genBackupCodes,
                  label: 'Generate backup codes',
                  style: AdaptiveButtonStyle.tinted)
            else ...[
              const Eyebrow('Backup codes — save these'),
              const SizedBox(height: 8),
              BrandCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final code in _backupCodes!)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: SelectableText(code,
                            style: TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 15,
                                letterSpacing: 1,
                                color: context.brandInk)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                icon: const Icon(Icons.copy, size: 16),
                label: const Text('Copy all'),
                onPressed: () => Clipboard.setData(
                    ClipboardData(text: _backupCodes!.join('\n'))),
              ),
            ],
            const SizedBox(height: 12),
            AdaptiveButton(
                onPressed: () => context.pop(), label: 'Done'),
          ] else if (_enroll == null) ...[
            const SizedBox(height: 60),
            Center(
                child: _busy
                    ? const LoaderFive('Preparing')
                    : Subtitle(_error ?? 'Could not start setup.')),
            if (!_busy) ...[
              const SizedBox(height: 16),
              AdaptiveButton(onPressed: _start, label: 'Retry'),
            ],
          ] else ...[
            const Eyebrow('Step 1 · Scan'),
            const SizedBox(height: 8),
            Subtitle('Scan this with your authenticator app, or enter the '
                'secret manually.'),
            const SizedBox(height: 16),
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                color: Colors.white,
                child: QrImageView(data: _enroll!.uri, size: 180),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton.icon(
                icon: const Icon(Icons.copy, size: 16),
                label: Text(_enroll!.secret),
                onPressed: () => Clipboard.setData(
                    ClipboardData(text: _enroll!.secret)),
              ),
            ),
            const SizedBox(height: 20),
            const Eyebrow('Step 2 · Verify'),
            const SizedBox(height: 8),
            AdaptiveTextField(
                controller: _code,
                placeholder: '6-digit code',
                keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            AdaptiveButton(
                onPressed: _busy ? null : _verify, label: 'Verify & enable'),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Subtitle(_error!),
            ],
          ],
        ],
      ),
    );
  }
}
