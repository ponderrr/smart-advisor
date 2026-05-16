import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Phase 0 placeholder. Confirms the app boots, Riverpod is wired, and the
/// Supabase client initialized against the existing project. Replaced by the
/// real shell + screens in Phase 3+.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Tolerate Supabase not being initialized (e.g. widget tests) instead of
    // throwing during build.
    Session? session;
    try {
      session = Supabase.instance.client.auth.currentSession;
    } catch (_) {
      session = null;
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Smart Advisor')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Text('Phase 0 skeleton — Flutter + Supabase wired.'),
            const SizedBox(height: 8),
            Text(
              session == null
                  ? 'Supabase client OK · no session'
                  : 'Supabase client OK · session active',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
