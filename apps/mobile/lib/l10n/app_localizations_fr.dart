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

  @override
  String get navHome => 'Accueil';

  @override
  String get navLibrary => 'Bibliothèque';

  @override
  String get navDiscover => 'Découvrir';

  @override
  String get navHistory => 'Historique';

  @override
  String get navProfile => 'Profil';

  @override
  String get onboardingReviewEyebrow => 'Un dernier coup d\'œil';

  @override
  String get onboardingReviewTitle => 'Tout est correct ?';

  @override
  String get onboardingReviewSubtitle =>
      'Modifiez ce que vous voulez avant l\'enregistrement.';

  @override
  String get reviewEdit => 'Modifier';

  @override
  String get reviewNone => 'Aucun';

  @override
  String get loading => 'Chargement';

  @override
  String get contactTitle => 'Nous contacter';

  @override
  String get contactSectionGetInTouch => 'Prendre contact';

  @override
  String get contactEmailSupport => 'Support par e-mail';

  @override
  String get contactReportBug => 'Signaler un bug';

  @override
  String get contactReportBugSubtitle => 'Ouvrir un ticket GitHub';

  @override
  String get contactViewSource => 'Voir le code source';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor est open source';

  @override
  String get contactFooterNote =>
      'Nous lisons chaque message — merci de préciser la version utilisée et ce que vous faisiez quand le problème est survenu.';

  @override
  String get contactEmailSubject => 'Smart Advisor — support';

  @override
  String get appearanceTitle => 'Apparence';

  @override
  String get themeLabel => 'Thème';

  @override
  String get themeSystem => 'Système';

  @override
  String get themeLight => 'Clair';

  @override
  String get themeDark => 'Sombre';

  @override
  String get amoledDarkTitle => 'Noir AMOLED';

  @override
  String get amoledDarkSubtitle => 'Surfaces noires pures en mode sombre.';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsWeeklyReminder => 'Rappel hebdomadaire du quiz';

  @override
  String get notificationsWeeklyOnHeading => 'Rappel hebdomadaire activé';

  @override
  String get notificationsWeeklyOnBody =>
      'Nous vous enverrons une notification chaque semaine pour découvrir quelque chose.';

  @override
  String get notificationsYourDataSection => 'Vos données';

  @override
  String get notificationsYearInReview => 'Votre année en revue';

  @override
  String get notificationsMonthInReview => 'Ce mois en revue';

  @override
  String get blockedPeopleTitle => 'Personnes bloquées';

  @override
  String get blockedLoadError =>
      'Impossible de charger votre liste de blocages.';

  @override
  String get blockedEmptyTitle => 'Personne de bloqué';

  @override
  String get blockedEmptyBody =>
      'Quand vous bloquez quelqu\'un depuis le fil, il apparaîtra ici pour pouvoir annuler.';

  @override
  String get blockedUnblock => 'Débloquer';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle débloqué.';
  }

  @override
  String get filedReportsTitle => 'Signalements envoyés';

  @override
  String get filedReportsLoadError => 'Impossible de charger vos signalements.';

  @override
  String get filedReportsEmptyTitle => 'Aucun signalement';

  @override
  String get filedReportsEmptyBody =>
      'Les publications et commentaires que vous signalez apparaîtront ici.';

  @override
  String get filedReportsOnPost => 'Sur une publication';

  @override
  String get filedReportsOnComment => 'Sur un commentaire';

  @override
  String get filedReportsContentRemoved => 'Contenu supprimé';

  @override
  String get filedReportsUnderReview => 'En cours d\'examen';

  @override
  String get profileUnavailableTitle => 'Profil indisponible';

  @override
  String get profileUnavailableBody =>
      'Il a peut-être été supprimé, ou le lien est incorrect.';

  @override
  String get profileUnavailableBack => 'Retour au flux';

  @override
  String get reportPostTitle => 'Signaler cette publication';

  @override
  String get reportCommentTitle => 'Signaler ce commentaire';

  @override
  String get reportSubheading =>
      'Dites-nous pourquoi pour que notre équipe puisse vérifier.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Harcèlement ou intimidation';

  @override
  String get reportReasonHate => 'Discours ou symboles haineux';

  @override
  String get reportReasonViolence => 'Violence ou menaces';

  @override
  String get reportReasonSexual => 'Contenu sexuel ou explicite';

  @override
  String get reportReasonMisinformation => 'Informations fausses';

  @override
  String get reportReasonOther => 'Autre chose';

  @override
  String get reportDetailsLabel => 'Ajouter des détails (facultatif)';

  @override
  String get reportDetailsHint => 'Une courte note nous aide à prioriser.';

  @override
  String get reportSubmit => 'Envoyer le signalement';

  @override
  String get reportThanks => 'Merci — nous allons vérifier.';

  @override
  String get reportError =>
      'Impossible d\'envoyer ce signalement. Veuillez réessayer.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Réponse du quiz qui expire';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Reçois un rappel avant la date limite de réponse.';

  @override
  String get notificationsInProgressTitle => 'Termine ce que tu as commencé';

  @override
  String get notificationsInProgressSub =>
      'Rappel hebdomadaire pour les choix encore en cours.';
}
