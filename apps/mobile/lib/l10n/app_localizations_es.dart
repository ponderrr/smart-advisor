// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get languageName => 'Español';

  @override
  String get languageSystemDefault => 'Predeterminado del sistema';

  @override
  String get languageStepEyebrow => 'Idioma';

  @override
  String get languageStepTitle => 'Elige tu idioma';

  @override
  String get languageStepSubtitle =>
      'Traduciremos la interfaz de la app para que coincida.';

  @override
  String get back => 'Atrás';

  @override
  String get next => 'Siguiente';

  @override
  String get skipForNow => 'Omitir por ahora';
}
