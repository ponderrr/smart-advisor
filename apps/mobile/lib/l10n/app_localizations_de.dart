// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get languageName => 'Deutsch';

  @override
  String get languageSystemDefault => 'Systemstandard';

  @override
  String get languageStepEyebrow => 'Sprache';

  @override
  String get languageStepTitle => 'Wähle deine Sprache';

  @override
  String get languageStepSubtitle =>
      'Wir übersetzen die App-Oberfläche entsprechend.';

  @override
  String get back => 'Zurück';

  @override
  String get next => 'Weiter';

  @override
  String get skipForNow => 'Vorerst überspringen';
}
