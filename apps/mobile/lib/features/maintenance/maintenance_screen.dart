import 'package:flutter/material.dart';

import '../../ui/ui.dart';

/// Port of web /maintenance. Shown when the maintenance flag is set.
class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: c.muted,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.build, size: 14, color: c.mutedForeground),
                const SizedBox(width: 6),
                Text('Maintenance',
                    style: TextStyle(
                        color: c.mutedForeground,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ]),
            ),
            const SizedBox(height: 20),
            Text("We'll be right back",
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: c.foreground)),
            const SizedBox(height: 8),
            Text('Smart Advisor is briefly down for maintenance.',
                style: TextStyle(color: c.mutedForeground)),
            const SizedBox(height: 20),
            const LoaderFive('Please wait'),
          ],
        ),
      ),
    );
  }
}

/// Port of web /auth/verified — the email-verified landing. The deep link
/// establishes the session; this just confirms and the router redirect
/// carries the user onward.
class VerifiedScreen extends StatelessWidget {
  const VerifiedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.check_circle, color: c.primary, size: 48),
          const SizedBox(height: 12),
          Text('Email verified',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: c.foreground)),
          const SizedBox(height: 8),
          Text('Taking you to the app…',
              style: TextStyle(color: c.mutedForeground)),
        ]),
      ),
    );
  }
}
