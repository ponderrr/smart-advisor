// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get languageName => 'English';

  @override
  String get languageSystemDefault => 'System default';

  @override
  String get languageStepEyebrow => 'Language';

  @override
  String get languageStepTitle => 'Pick your language';

  @override
  String get languageStepSubtitle =>
      'We\'ll translate the app interface to match.';

  @override
  String get back => 'Back';

  @override
  String get next => 'Next';

  @override
  String get skipForNow => 'Skip for now';
}
