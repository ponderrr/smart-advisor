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
  String get languageSystemDefault => 'Par défaut du système';

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

  @override
  String get getStartedHeadline =>
      'Choisissez quelque chose\nqui vaut votre soirée.';

  @override
  String get getStartedBody =>
      'Films. Livres. Musique. Dites-nous votre humeur et recevez une suggestion qui colle — avec une raison en une ligne.';

  @override
  String get getStartedPrimary => 'Commencer';

  @override
  String get getStartedSecondary => 'J\'ai déjà un compte';

  @override
  String get closePreview => 'Fermer l\'aperçu';

  @override
  String get finish => 'Terminer';

  @override
  String get onboardingNameEyebrow => 'Commençons par le début';

  @override
  String get onboardingNameTitle => 'Comment doit-on vous appeler ?';

  @override
  String get onboardingNameSubtitle =>
      'Nous vous saluerons ainsi lorsque nous proposerons des suggestions.';

  @override
  String get onboardingFocusEyebrow =>
      'Ce pour quoi vous voulez des suggestions';

  @override
  String get onboardingFocusTitle => 'Films, livres, musique, ou les trois ?';

  @override
  String get onboardingFocusSubtitle =>
      'Définit la valeur par défaut de chaque quiz. Vous pouvez la changer à tout moment.';

  @override
  String get contentMovies => 'Films';

  @override
  String get contentBooks => 'Livres';

  @override
  String get contentMusic => 'Musique';

  @override
  String get contentMix => 'Un mélange';

  @override
  String get onboardingAvoidEyebrow => 'Quelque chose à éviter ?';

  @override
  String get onboardingAvoidTitle =>
      'Les genres que vous préférez ne jamais voir.';

  @override
  String get onboardingAvoidSubtitle =>
      'Touchez-en un pour ajouter une règle stricte \"ne pas recommander\". Ignorez l\'étape si rien ne vous vient.';

  @override
  String get onboardingRemindersEyebrow => 'Rappels';

  @override
  String get onboardingRemindersTitle =>
      'Vous voulez un rappel hebdomadaire de nouvelles suggestions ?';

  @override
  String get onboardingRemindersSubtitle =>
      'Une notification discrète par semaine. Nous vous relancerons aussi si vous avez des choses en cours.';

  @override
  String get remindersOff => 'Désactivé';

  @override
  String get remindersWeekly => 'Hebdomadaire';

  @override
  String get onboardingRemindersOnHint =>
      'Nous demanderons l\'autorisation d\'envoyer des notifications à la fin.';

  @override
  String get onboardingRemindersOffHint =>
      'Vous pouvez l\'activer à tout moment dans Réglages → Notifications.';
}
