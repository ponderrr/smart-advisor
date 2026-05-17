import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/library/services/library_service.dart';
import '../../features/recommendations/services/ai_service.dart';
import '../../features/recommendations/services/database_service.dart';
import '../../features/recommendations/services/tmdb_service.dart';
import '../supabase/supabase_providers.dart';

final aiServiceProvider = Provider<AiService>(
    (ref) => AiService(ref.watch(supabaseClientProvider)));

final tmdbServiceProvider = Provider<TmdbService>(
    (ref) => TmdbService(ref.watch(supabaseClientProvider)));

final databaseServiceProvider = Provider<DatabaseService>(
    (ref) => DatabaseService(ref.watch(supabaseClientProvider)));

final libraryServiceProvider = Provider<LibraryService>(
    (ref) => LibraryService(ref.watch(supabaseClientProvider)));
