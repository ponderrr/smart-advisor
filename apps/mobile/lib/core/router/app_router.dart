import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/home_screen.dart';
import '../../ui/gallery/gallery_screen.dart';

/// Root navigation. Routes are added per phase (auth → quiz → results → …).
/// Kept as a Riverpod provider so later phases can gate redirects on auth
/// state without restructuring.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: <RouteBase>[
      GoRoute(
        path: '/',
        builder: (BuildContext context, GoRouterState state) =>
            const HomeScreen(),
      ),
      // Dev-only design-system gallery (Phase 2). Replaced by real routes
      // as screens land in Phase 3+.
      GoRoute(
        path: '/gallery',
        builder: (BuildContext context, GoRouterState state) =>
            const GalleryScreen(),
      ),
    ],
  );
});
