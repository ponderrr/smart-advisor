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
  String get languageSystemDefault => 'Systeemstandaard';

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

  @override
  String get getStartedHeadline => 'Kies iets dat\nje avond waard is.';

  @override
  String get getStartedBody =>
      'Films. Boeken. Muziek. Vertel ons je stemming en krijg een passende keuze — met een reden in één regel.';

  @override
  String get getStartedPrimary => 'Aan de slag';

  @override
  String get getStartedSecondary => 'Ik heb al een account';

  @override
  String get closePreview => 'Voorbeeld sluiten';

  @override
  String get finish => 'Voltooien';

  @override
  String get onboardingNameEyebrow => 'Eerst het belangrijkste';

  @override
  String get onboardingNameTitle => 'Hoe mogen we je noemen?';

  @override
  String get onboardingNameSubtitle =>
      'Zo begroeten we je wanneer we keuzes tonen.';

  @override
  String get onboardingFocusEyebrow => 'Waarvoor je keuzes wilt';

  @override
  String get onboardingFocusTitle => 'Films, boeken, muziek of alle drie?';

  @override
  String get onboardingFocusSubtitle =>
      'Stelt de standaard in voor elke quiz. Je kunt het bij elke quiz wijzigen.';

  @override
  String get contentMovies => 'Films';

  @override
  String get contentBooks => 'Boeken';

  @override
  String get contentMusic => 'Muziek';

  @override
  String get contentMix => 'Een mix';

  @override
  String get onboardingAvoidEyebrow => 'Iets overslaan?';

  @override
  String get onboardingAvoidTitle => 'Genres die je liever nooit ziet.';

  @override
  String get onboardingAvoidSubtitle =>
      'Tik er een aan om een harde \"niet aanbevelen\"-regel toe te voegen. Sla de stap over als je niets te binnen schiet.';

  @override
  String get onboardingRemindersEyebrow => 'Herinneringen';

  @override
  String get onboardingRemindersTitle =>
      'Wil je een wekelijkse herinnering met nieuwe keuzes?';

  @override
  String get onboardingRemindersSubtitle =>
      'Eén rustige melding per week. We porren je ook als je nog dingen onderhanden hebt.';

  @override
  String get remindersOff => 'Uit';

  @override
  String get remindersWeekly => 'Wekelijks';

  @override
  String get onboardingRemindersOnHint =>
      'We vragen aan het eind toestemming om meldingen te sturen.';

  @override
  String get onboardingRemindersOffHint =>
      'Je kunt dit altijd inschakelen via Instellingen → Meldingen.';

  @override
  String get navHome => 'Start';

  @override
  String get navLibrary => 'Bibliotheek';

  @override
  String get navDiscover => 'Ontdek';

  @override
  String get navHistory => 'Geschiedenis';

  @override
  String get navProfile => 'Profiel';

  @override
  String get onboardingReviewEyebrow => 'Nog even checken';

  @override
  String get onboardingReviewTitle => 'Klopt dit?';

  @override
  String get onboardingReviewSubtitle =>
      'Pas aan wat je wilt voordat we het opslaan.';

  @override
  String get reviewEdit => 'Wijzig';

  @override
  String get reviewNone => 'Geen';

  @override
  String get loading => 'Laden';

  @override
  String get contactTitle => 'Neem contact op';

  @override
  String get contactSectionGetInTouch => 'Contact opnemen';

  @override
  String get contactEmailSupport => 'Ondersteuning per e-mail';

  @override
  String get contactReportBug => 'Bug melden';

  @override
  String get contactReportBugSubtitle => 'Open een GitHub-issue';

  @override
  String get contactViewSource => 'Bekijk de broncode';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor is open source';

  @override
  String get contactFooterNote =>
      'We lezen elk bericht — vermeld welke versie je gebruikt en wat je deed toen iets misging.';

  @override
  String get contactEmailSubject => 'Smart Advisor — ondersteuning';

  @override
  String get appearanceTitle => 'Weergave';

  @override
  String get themeLabel => 'Thema';

  @override
  String get themeSystem => 'Systeem';

  @override
  String get themeLight => 'Licht';

  @override
  String get themeDark => 'Donker';

  @override
  String get amoledDarkTitle => 'AMOLED-donker';

  @override
  String get amoledDarkSubtitle =>
      'Volledig zwarte oppervlakken in donkere modus.';

  @override
  String get notificationsTitle => 'Meldingen';

  @override
  String get notificationsWeeklyReminder => 'Wekelijkse quiz-herinnering';

  @override
  String get notificationsWeeklyOnHeading => 'Wekelijkse herinnering aan';

  @override
  String get notificationsWeeklyOnBody =>
      'We herinneren je wekelijks om iets te ontdekken.';

  @override
  String get notificationsYourDataSection => 'Jouw gegevens';

  @override
  String get notificationsYearInReview => 'Jouw jaar in beeld';

  @override
  String get notificationsMonthInReview => 'Deze maand in beeld';

  @override
  String get blockedPeopleTitle => 'Geblokkeerde personen';

  @override
  String get blockedLoadError => 'Kon je geblokkeerde lijst niet laden.';

  @override
  String get blockedEmptyTitle => 'Niemand geblokkeerd';

  @override
  String get blockedEmptyBody =>
      'Wanneer je iemand vanuit de feed blokkeert, verschijnt die hier zodat je het kunt terugdraaien.';

  @override
  String get blockedUnblock => 'Deblokkeer';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle gedeblokkeerd.';
  }

  @override
  String get filedReportsTitle => 'Gemelde rapporten';

  @override
  String get filedReportsLoadError => 'Kon je rapporten niet laden.';

  @override
  String get filedReportsEmptyTitle => 'Geen rapporten';

  @override
  String get filedReportsEmptyBody =>
      'Berichten en reacties die je markeert voor beoordeling verschijnen hier.';

  @override
  String get filedReportsOnPost => 'Op een bericht';

  @override
  String get filedReportsOnComment => 'Op een reactie';

  @override
  String get filedReportsContentRemoved => 'Inhoud verwijderd';

  @override
  String get filedReportsUnderReview => 'In behandeling';

  @override
  String get profileUnavailableTitle => 'Profiel niet beschikbaar';

  @override
  String get profileUnavailableBody =>
      'Mogelijk verwijderd, of de link klopt niet.';

  @override
  String get profileUnavailableBack => 'Terug naar feed';

  @override
  String get reportPostTitle => 'Dit bericht melden';

  @override
  String get reportCommentTitle => 'Deze reactie melden';

  @override
  String get reportSubheading =>
      'Vertel ons waarom, dan kijkt ons team ernaar.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Intimidatie of pesten';

  @override
  String get reportReasonHate => 'Haatzaaiende uitingen of symbolen';

  @override
  String get reportReasonViolence => 'Geweld of bedreigingen';

  @override
  String get reportReasonSexual => 'Seksuele of expliciete inhoud';

  @override
  String get reportReasonMisinformation => 'Onjuiste informatie';

  @override
  String get reportReasonOther => 'Iets anders';

  @override
  String get reportDetailsLabel => 'Details toevoegen (optioneel)';

  @override
  String get reportDetailsHint =>
      'Een korte toelichting helpt ons prioriteren.';

  @override
  String get reportSubmit => 'Melding versturen';

  @override
  String get reportThanks => 'Bedankt — we kijken ernaar.';

  @override
  String get reportError =>
      'Melding kon niet worden verstuurd. Probeer opnieuw.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Groepsquiz-antwoord verloopt';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Krijg een seintje voor je antwoorddeadline.';

  @override
  String get notificationsInProgressTitle => 'Maak af wat je bent begonnen';

  @override
  String get notificationsInProgressSub =>
      'Wekelijkse herinnering voor lopende picks.';
}
