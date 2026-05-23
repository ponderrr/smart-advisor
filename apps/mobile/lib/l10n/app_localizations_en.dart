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

  @override
  String get getStartedHeadline => 'Pick something\nworth your night.';

  @override
  String get getStartedBody =>
      'Movies. Books. Music. Tell us your mood and get a pick that fits — with a one-line reason why.';

  @override
  String get getStartedPrimary => 'Get started';

  @override
  String get getStartedSecondary => 'I already have an account';

  @override
  String get closePreview => 'Close preview';

  @override
  String get finish => 'Finish';

  @override
  String get onboardingNameEyebrow => 'First things first';

  @override
  String get onboardingNameTitle => 'What should we call you?';

  @override
  String get onboardingNameSubtitle =>
      'We\'ll greet you by this when we surface picks.';

  @override
  String get onboardingFocusEyebrow => 'What you want picks for';

  @override
  String get onboardingFocusTitle => 'Movies, books, music, or all three?';

  @override
  String get onboardingFocusSubtitle =>
      'Sets the default for every quiz. You can change it on any quiz.';

  @override
  String get contentMovies => 'Movies';

  @override
  String get contentBooks => 'Books';

  @override
  String get contentMusic => 'Music';

  @override
  String get contentMix => 'A mix';

  @override
  String get onboardingAvoidEyebrow => 'Anything to skip?';

  @override
  String get onboardingAvoidTitle => 'Genres you\'d rather never see.';

  @override
  String get onboardingAvoidSubtitle =>
      'Tap any to add a hard \"don\'t recommend\" rule. Skip the step if nothing comes to mind.';

  @override
  String get onboardingRemindersEyebrow => 'Reminders';

  @override
  String get onboardingRemindersTitle => 'Want a weekly fresh-picks nudge?';

  @override
  String get onboardingRemindersSubtitle =>
      'One quiet notification per week. We\'ll also nudge you if you\'ve got things in progress.';

  @override
  String get remindersOff => 'Off';

  @override
  String get remindersWeekly => 'Weekly';

  @override
  String get onboardingRemindersOnHint =>
      'We\'ll ask permission to send notifications when you finish.';

  @override
  String get onboardingRemindersOffHint =>
      'You can turn this on anytime in Settings → Notifications.';

  @override
  String get navHome => 'Home';

  @override
  String get navLibrary => 'Library';

  @override
  String get navDiscover => 'Discover';

  @override
  String get navHistory => 'History';

  @override
  String get navProfile => 'Profile';

  @override
  String get onboardingReviewEyebrow => 'One last look';

  @override
  String get onboardingReviewTitle => 'Does this look right?';

  @override
  String get onboardingReviewSubtitle =>
      'Edit anything you\'d like to change before we save it.';

  @override
  String get reviewEdit => 'Edit';

  @override
  String get reviewNone => 'None';

  @override
  String get loading => 'Loading';

  @override
  String get contactTitle => 'Contact us';

  @override
  String get contactSectionGetInTouch => 'Get in touch';

  @override
  String get contactEmailSupport => 'Email support';

  @override
  String get contactReportBug => 'Report a bug';

  @override
  String get contactReportBugSubtitle => 'Open a GitHub issue';

  @override
  String get contactViewSource => 'View the source';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor is open source';

  @override
  String get contactFooterNote =>
      'We read every message — please mention which version you\'re running and what you were doing when something went wrong.';

  @override
  String get contactEmailSubject => 'Smart Advisor — support';

  @override
  String get appearanceTitle => 'Appearance';

  @override
  String get themeLabel => 'Theme';

  @override
  String get themeSystem => 'System';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get amoledDarkTitle => 'AMOLED dark';

  @override
  String get amoledDarkSubtitle => 'True-black surfaces in dark mode.';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsWeeklyReminder => 'Weekly quiz reminder';

  @override
  String get notificationsWeeklyOnHeading => 'Weekly reminder on';

  @override
  String get notificationsWeeklyOnBody =>
      'We\'ll nudge you weekly to discover something.';

  @override
  String get notificationsYourDataSection => 'Your data';

  @override
  String get notificationsYearInReview => 'Your year in review';

  @override
  String get notificationsMonthInReview => 'This month in review';

  @override
  String get blockedPeopleTitle => 'Blocked people';

  @override
  String get blockedLoadError => 'Couldn\'t load your blocked list.';

  @override
  String get blockedEmptyTitle => 'Nobody blocked';

  @override
  String get blockedEmptyBody =>
      'When you block someone from the feed, they\'ll show up here so you can undo it.';

  @override
  String get blockedUnblock => 'Unblock';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle unblocked.';
  }

  @override
  String get filedReportsTitle => 'Reports you\'ve filed';

  @override
  String get filedReportsLoadError => 'Couldn\'t load your reports.';

  @override
  String get filedReportsEmptyTitle => 'No reports filed';

  @override
  String get filedReportsEmptyBody =>
      'Posts and comments you flag for review will show up here.';

  @override
  String get filedReportsOnPost => 'On a post';

  @override
  String get filedReportsOnComment => 'On a comment';

  @override
  String get filedReportsContentRemoved => 'Content removed';

  @override
  String get filedReportsUnderReview => 'Under review';

  @override
  String get filedReportsReviewed => 'Reviewed';

  @override
  String get filedReportsDismissed => 'Dismissed';

  @override
  String get profileUnavailableTitle => 'Profile isn\'t available';

  @override
  String get profileUnavailableBody =>
      'It may have been removed, or the link is wrong.';

  @override
  String get profileUnavailableBack => 'Back to feed';

  @override
  String get reportPostTitle => 'Report this post';

  @override
  String get reportCommentTitle => 'Report this comment';

  @override
  String get reportSubheading => 'Tell us why so our team can take a look.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Harassment or bullying';

  @override
  String get reportReasonHate => 'Hate speech or symbols';

  @override
  String get reportReasonViolence => 'Violence or threats';

  @override
  String get reportReasonSexual => 'Sexual or explicit content';

  @override
  String get reportReasonMisinformation => 'False information';

  @override
  String get reportReasonOther => 'Something else';

  @override
  String get reportDetailsLabel => 'Add details (optional)';

  @override
  String get reportDetailsHint => 'A short note helps us prioritize.';

  @override
  String get reportSubmit => 'Submit report';

  @override
  String get reportThanks => 'Thanks — we\'ll take a look.';

  @override
  String get reportError => 'Couldn\'t send that report. Please try again.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Group quiz answer expiring';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Get a nudge before your answer-by deadline.';

  @override
  String get notificationsInProgressTitle => 'Finish what you started';

  @override
  String get notificationsInProgressSub =>
      'Weekly nudge for picks still in progress.';
}
