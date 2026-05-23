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
  String get languageSystemDefault => 'Predefinito del sistema';

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

  @override
  String get getStartedHeadline => 'Scegli qualcosa che\nvalga la tua serata.';

  @override
  String get getStartedBody =>
      'Film. Libri. Musica. Dicci il tuo umore e ricevi una scelta su misura — con un motivo in una riga.';

  @override
  String get getStartedPrimary => 'Inizia';

  @override
  String get getStartedSecondary => 'Ho già un account';

  @override
  String get closePreview => 'Chiudi anteprima';

  @override
  String get finish => 'Fine';

  @override
  String get onboardingNameEyebrow => 'Iniziamo dall\'inizio';

  @override
  String get onboardingNameTitle => 'Come dovremmo chiamarti?';

  @override
  String get onboardingNameSubtitle =>
      'Ti saluteremo così quando mostriamo i consigli.';

  @override
  String get onboardingFocusEyebrow => 'Per cosa vuoi i consigli';

  @override
  String get onboardingFocusTitle => 'Film, libri, musica o tutti e tre?';

  @override
  String get onboardingFocusSubtitle =>
      'Imposta il valore predefinito per ogni quiz. Puoi cambiarlo in qualsiasi quiz.';

  @override
  String get contentMovies => 'Film';

  @override
  String get contentBooks => 'Libri';

  @override
  String get contentMusic => 'Musica';

  @override
  String get contentMix => 'Un mix';

  @override
  String get onboardingAvoidEyebrow => 'Qualcosa da saltare?';

  @override
  String get onboardingAvoidTitle => 'Generi che preferiresti non vedere mai.';

  @override
  String get onboardingAvoidSubtitle =>
      'Tocca un genere per aggiungere una regola ferma di \"non consigliare\". Salta il passaggio se non ti viene in mente nulla.';

  @override
  String get onboardingRemindersEyebrow => 'Promemoria';

  @override
  String get onboardingRemindersTitle =>
      'Vuoi un promemoria settimanale di nuovi consigli?';

  @override
  String get onboardingRemindersSubtitle =>
      'Una notifica discreta a settimana. Ti avviseremo anche se hai cose in sospeso.';

  @override
  String get remindersOff => 'Off';

  @override
  String get remindersWeekly => 'Settimanale';

  @override
  String get onboardingRemindersOnHint =>
      'Ti chiederemo il permesso di inviare notifiche al termine.';

  @override
  String get onboardingRemindersOffHint =>
      'Puoi attivarlo quando vuoi in Impostazioni → Notifiche.';

  @override
  String get navHome => 'Home';

  @override
  String get navLibrary => 'Libreria';

  @override
  String get navDiscover => 'Scopri';

  @override
  String get navHistory => 'Cronologia';

  @override
  String get navProfile => 'Profilo';

  @override
  String get onboardingReviewEyebrow => 'Un ultimo sguardo';

  @override
  String get onboardingReviewTitle => 'Va tutto bene?';

  @override
  String get onboardingReviewSubtitle =>
      'Modifica ciò che vuoi prima di salvare.';

  @override
  String get reviewEdit => 'Modifica';

  @override
  String get reviewNone => 'Nessuno';

  @override
  String get loading => 'Caricamento';

  @override
  String get contactTitle => 'Contattaci';

  @override
  String get contactSectionGetInTouch => 'Mettiti in contatto';

  @override
  String get contactEmailSupport => 'Supporto via email';

  @override
  String get contactReportBug => 'Segnala un bug';

  @override
  String get contactReportBugSubtitle => 'Apri un issue su GitHub';

  @override
  String get contactViewSource => 'Vedi il codice';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor è open source';

  @override
  String get contactFooterNote =>
      'Leggiamo ogni messaggio — per favore indica la versione che usi e cosa stavi facendo quando qualcosa è andato storto.';

  @override
  String get contactEmailSubject => 'Smart Advisor — supporto';

  @override
  String get appearanceTitle => 'Aspetto';

  @override
  String get themeLabel => 'Tema';

  @override
  String get themeSystem => 'Sistema';

  @override
  String get themeLight => 'Chiaro';

  @override
  String get themeDark => 'Scuro';

  @override
  String get amoledDarkTitle => 'Nero AMOLED';

  @override
  String get amoledDarkSubtitle => 'Superfici nero puro in modalità scura.';

  @override
  String get notificationsTitle => 'Notifiche';

  @override
  String get notificationsWeeklyReminder => 'Promemoria settimanale del quiz';

  @override
  String get notificationsWeeklyOnHeading => 'Promemoria settimanale attivo';

  @override
  String get notificationsWeeklyOnBody =>
      'Ti ricorderemo settimanalmente di scoprire qualcosa.';

  @override
  String get notificationsYourDataSection => 'I tuoi dati';

  @override
  String get notificationsYearInReview => 'Il tuo anno in rassegna';

  @override
  String get notificationsMonthInReview => 'Questo mese in rassegna';

  @override
  String get blockedPeopleTitle => 'Persone bloccate';

  @override
  String get blockedLoadError =>
      'Impossibile caricare la tua lista di blocchi.';

  @override
  String get blockedEmptyTitle => 'Nessuno bloccato';

  @override
  String get blockedEmptyBody =>
      'Quando blocchi qualcuno dal feed, appare qui per poter annullare.';

  @override
  String get blockedUnblock => 'Sblocca';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle sbloccato.';
  }

  @override
  String get filedReportsTitle => 'Segnalazioni inviate';

  @override
  String get filedReportsLoadError =>
      'Impossibile caricare le tue segnalazioni.';

  @override
  String get filedReportsEmptyTitle => 'Nessuna segnalazione';

  @override
  String get filedReportsEmptyBody =>
      'I post e i commenti che segnali per la revisione appariranno qui.';

  @override
  String get filedReportsOnPost => 'Su un post';

  @override
  String get filedReportsOnComment => 'Su un commento';

  @override
  String get filedReportsContentRemoved => 'Contenuto rimosso';

  @override
  String get filedReportsUnderReview => 'In revisione';

  @override
  String get profileUnavailableTitle => 'Profilo non disponibile';

  @override
  String get profileUnavailableBody =>
      'Potrebbe essere stato rimosso o il link è errato.';

  @override
  String get profileUnavailableBack => 'Torna al feed';

  @override
  String get reportPostTitle => 'Segnala questo post';

  @override
  String get reportCommentTitle => 'Segnala questo commento';

  @override
  String get reportSubheading =>
      'Dicci perché così il nostro team può controllare.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Molestie o bullismo';

  @override
  String get reportReasonHate => 'Incitamento all\'odio o simboli';

  @override
  String get reportReasonViolence => 'Violenza o minacce';

  @override
  String get reportReasonSexual => 'Contenuto sessuale o esplicito';

  @override
  String get reportReasonMisinformation => 'Informazioni false';

  @override
  String get reportReasonOther => 'Qualcos\'altro';

  @override
  String get reportDetailsLabel => 'Aggiungi dettagli (opzionale)';

  @override
  String get reportDetailsHint => 'Una breve nota ci aiuta a dare priorità.';

  @override
  String get reportSubmit => 'Invia segnalazione';

  @override
  String get reportThanks => 'Grazie — daremo un\'occhiata.';

  @override
  String get reportError => 'Impossibile inviare la segnalazione. Riprova.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Risposta del quiz in scadenza';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Ricevi un promemoria prima della scadenza per rispondere.';

  @override
  String get notificationsInProgressTitle => 'Finisci ciò che hai iniziato';

  @override
  String get notificationsInProgressSub =>
      'Promemoria settimanale per gli elementi ancora in corso.';
}
