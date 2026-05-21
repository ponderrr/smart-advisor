// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Dutch Flemish (`nl`).
class AppLocalizationsNl extends AppLocalizations {
  AppLocalizationsNl([String locale = 'nl']) : super(locale);

  @override
  String get languageName => 'Nederlands';

  @override
  String get languageStepEyebrow => 'Taal';

  @override
  String get languageStepTitle => 'Kies je taal';

  @override
  String get languageStepSubtitle =>
      'We vertalen de app-interface dienovereenkomstig.';

  @override
  String get back => 'Terug';

  @override
  String get next => 'Volgende';

  @override
  String get skipForNow => 'Voorlopig overslaan';
}
