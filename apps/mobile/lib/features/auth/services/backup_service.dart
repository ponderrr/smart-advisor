import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/result.dart';

/// Port of web backup-service.ts. All direct Supabase — backup_codes RLS
/// permits the authenticated user full CRUD on their own rows.
class BackupService {
  BackupService(this._c);
  final SupabaseClient _c;

  String _hash(String code) {
    final norm = code.replaceAll(RegExp(r'[\s-]'), '').toUpperCase();
    return sha256.convert(utf8.encode(norm)).toString();
  }

  String _genCode(Random r) {
    String chunk() => List.generate(
        5, (_) => '0123456789ABCDEF'[r.nextInt(16)]).join();
    return '${chunk()}-${chunk()}';
  }

  Future<({List<String> codes, String? error})> generateBackupCodes(
      [int count = 10]) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return (codes: <String>[], error: 'Not authenticated');
    final r = Random.secure();
    final codes = List.generate(count, (_) => _genCode(r));
    try {
      await _c.from('backup_codes').delete().eq('user_id', uid);
      await _c.from('backup_codes').insert([
        for (final code in codes)
          {'user_id': uid, 'code_hash': _hash(code)},
      ]);
      return (codes: codes, error: null);
    } on PostgrestException catch (e) {
      return (codes: <String>[], error: e.message);
    }
  }

  Future<ServiceResult<void>> verifyBackupCode(String code) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    try {
      final row = await _c
          .from('backup_codes')
          .select('id')
          .eq('user_id', uid)
          .eq('code_hash', _hash(code))
          .isFilter('used_at', null)
          .limit(1)
          .maybeSingle();
      if (row == null) return ServiceResult.fail('Invalid backup code.');
      await _c.from('backup_codes').update({
        'used_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', row['id'] as String);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<int> remainingCount() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return 0;
    final rows = await _c
        .from('backup_codes')
        .select('id')
        .eq('user_id', uid)
        .isFilter('used_at', null);
    return rows.length;
  }

  Future<ServiceResult<void>> setBackupEmail(String email) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    final e = email.trim().toLowerCase();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(e)) {
      return ServiceResult.fail('Enter a valid email.');
    }
    if (e == _c.auth.currentUser?.email?.toLowerCase()) {
      return ServiceResult.fail('Use a different email than your primary.');
    }
    try {
      await _c.from('profiles').update({
        'backup_email': e,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', uid);
      return ServiceResult.ok(null);
    } on PostgrestException catch (ex) {
      return ServiceResult.fail(ex.message);
    }
  }

  Future<String?> getBackupEmail() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return null;
    final row = await _c
        .from('profiles')
        .select('backup_email')
        .eq('id', uid)
        .maybeSingle();
    return row?['backup_email'] as String?;
  }

  Future<ServiceResult<void>> removeBackupEmail() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    try {
      await _c.from('profiles').update({
        'backup_email': null,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', uid);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }
}
