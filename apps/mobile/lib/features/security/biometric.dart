import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/supabase/supabase_providers.dart';
import '../../ui/ui.dart';

const _key = 'sa.biometric_lock';

/// Whether the app requires Face ID / Touch ID / fingerprint to open.
class BiometricLock extends Notifier<bool> {
  @override
  bool build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return prefs?.getBool(_key) ?? false;
  }

  Future<void> set(bool v) async {
    state = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, v);
  }
}

final biometricLockProvider =
    NotifierProvider<BiometricLock, bool>(BiometricLock.new);

final _localAuth = LocalAuthentication();

Future<bool> biometricAvailable() async {
  try {
    return await _localAuth.isDeviceSupported() &&
        await _localAuth.canCheckBiometrics;
  } catch (_) {
    return false;
  }
}

Future<bool> biometricAuthenticate() async {
  try {
    return await _localAuth.authenticate(
      localizedReason: 'Unlock Smart Advisor',
      biometricOnly: true,
      persistAcrossBackgrounding: true,
    );
  } catch (_) {
    return false;
  }
}

/// Wraps the app: when the lock is enabled, blocks the UI behind a biometric
/// prompt until the user authenticates (re-locks on background→foreground).
class BiometricGate extends ConsumerStatefulWidget {
  const BiometricGate({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<BiometricGate> createState() => _BiometricGateState();
}

class _BiometricGateState extends ConsumerState<BiometricGate>
    with WidgetsBindingObserver {
  bool _unlocked = false;
  bool _prompting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState s) {
    if (s == AppLifecycleState.paused) _unlocked = false;
  }

  Future<void> _tryUnlock() async {
    if (_prompting) return;
    _prompting = true;
    final ok = await biometricAuthenticate();
    _prompting = false;
    if (mounted && ok) setState(() => _unlocked = true);
  }

  @override
  Widget build(BuildContext context) {
    final locked = ref.watch(biometricLockProvider);
    if (!locked || _unlocked) return widget.child;

    WidgetsBinding.instance.addPostFrameCallback((_) => _tryUnlock());
    final c = context.colors;
    return Material(
      color: c.background,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 40, color: c.mutedForeground),
            const SizedBox(height: 16),
            const BrandHeading('Locked', size: 22),
            const SizedBox(height: 8),
            Subtitle('Unlock with biometrics to continue.'),
            const SizedBox(height: 20),
            AdaptiveButton(onPressed: _tryUnlock, label: 'Unlock'),
          ],
        ),
      ),
    );
  }
}
