import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/env.dart';
import '../../core/models/app_user.dart';
import '../../core/supabase/supabase_providers.dart';
import 'services/auth_service.dart';
import 'services/backup_service.dart';
import 'services/mfa_service.dart';
import 'services/session_record_service.dart';

final authServiceProvider =
    Provider<AuthService>((ref) => AuthService(ref.watch(supabaseClientProvider)));

final mfaServiceProvider =
    Provider<MfaService>((ref) => MfaService(ref.watch(supabaseClientProvider)));

final backupServiceProvider = Provider<BackupService>(
    (ref) => BackupService(ref.watch(supabaseClientProvider)));

final sessionRecordServiceProvider = Provider<SessionRecordService>(
    (ref) => SessionRecordService(ref.watch(supabaseClientProvider)));

/// Current user's profile row (drives the onboarding-incomplete redirect via
/// setup_completed_at). Refreshes when auth state changes.
final currentProfileProvider = FutureProvider<AppUser?>((ref) async {
  final session = ref.watch(currentSessionProvider);
  if (session == null) return null;
  final res = await ref.watch(authServiceProvider).getCurrentUser();
  return res.data;
});

/// Maintenance mode — web uses a server env var + middleware; mobile reads a
/// build/runtime flag. (A remote kill-switch is a Phase 7 hardening item.)
final maintenanceModeProvider = Provider<bool>((ref) {
  return const String.fromEnvironment('MAINTENANCE_MODE') == 'true' ||
      Env.maintenanceMode;
});
