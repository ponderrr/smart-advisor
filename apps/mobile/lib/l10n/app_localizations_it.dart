// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class AppLocalizationsIt extends AppLocalizations {
  AppLocalizationsIt([String locale = 'it']) : super(locale);

  @override
  String get languageName => 'Italiano';

  @override
  String get languageStepEyebrow => 'Lingua';

  @override
  String get languageStepTitle => 'Scegli la tua lingua';

  @override
  String get languageStepSubtitle =>
      'Tradurremo l\'interfaccia dell\'app di conseguenza.';

  @override
  String get back => 'Indietro';

  @override
  String get next => 'Avanti';

  @override
  String get skipForNow => 'Salta per ora';
}
