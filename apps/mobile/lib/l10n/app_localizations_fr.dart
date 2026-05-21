// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get languageName => 'Français';

  @override
  String get languageStepEyebrow => 'Langue';

  @override
  String get languageStepTitle => 'Choisissez votre langue';

  @override
  String get languageStepSubtitle =>
      'Nous traduirons l\'interface de l\'application en conséquence.';

  @override
  String get back => 'Retour';

  @override
  String get next => 'Suivant';

  @override
  String get skipForNow => 'Ignorer pour l\'instant';
}
