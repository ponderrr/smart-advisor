import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_it.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_nl.dart';
import 'app_localizations_pt.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('it'),
    Locale('ja'),
    Locale('ko'),
    Locale('nl'),
    Locale('pt'),
    Locale('zh'),
  ];

  /// The language's own name, shown in the language picker.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageName;

  /// Language-picker option to follow the device language.
  ///
  /// In en, this message translates to:
  /// **'System default'**
  String get languageSystemDefault;

  /// Eyebrow label on the onboarding language step.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageStepEyebrow;

  /// Heading on the onboarding language step.
  ///
  /// In en, this message translates to:
  /// **'Pick your language'**
  String get languageStepTitle;

  /// Subtitle on the onboarding language step.
  ///
  /// In en, this message translates to:
  /// **'We\'ll translate the app interface to match.'**
  String get languageStepSubtitle;

  /// Generic Back button.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// Generic Next button.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// Skip action on multi-step flows.
  ///
  /// In en, this message translates to:
  /// **'Skip for now'**
  String get skipForNow;

  /// Entry-surface string: getStartedHeadline
  ///
  /// In en, this message translates to:
  /// **'Pick something\nworth your night.'**
  String get getStartedHeadline;

  /// Entry-surface string: getStartedBody
  ///
  /// In en, this message translates to:
  /// **'Movies. Books. Music. Tell us your mood and get a pick that fits — with a one-line reason why.'**
  String get getStartedBody;

  /// Entry-surface string: getStartedPrimary
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStartedPrimary;

  /// Entry-surface string: getStartedSecondary
  ///
  /// In en, this message translates to:
  /// **'I already have an account'**
  String get getStartedSecondary;

  /// Entry-surface string: closePreview
  ///
  /// In en, this message translates to:
  /// **'Close preview'**
  String get closePreview;

  /// Entry-surface string: finish
  ///
  /// In en, this message translates to:
  /// **'Finish'**
  String get finish;

  /// Entry-surface string: onboardingNameEyebrow
  ///
  /// In en, this message translates to:
  /// **'First things first'**
  String get onboardingNameEyebrow;

  /// Entry-surface string: onboardingNameTitle
  ///
  /// In en, this message translates to:
  /// **'What should we call you?'**
  String get onboardingNameTitle;

  /// Entry-surface string: onboardingNameSubtitle
  ///
  /// In en, this message translates to:
  /// **'We\'ll greet you by this when we surface picks.'**
  String get onboardingNameSubtitle;

  /// Entry-surface string: onboardingFocusEyebrow
  ///
  /// In en, this message translates to:
  /// **'What you want picks for'**
  String get onboardingFocusEyebrow;

  /// Entry-surface string: onboardingFocusTitle
  ///
  /// In en, this message translates to:
  /// **'Movies, books, music, or all three?'**
  String get onboardingFocusTitle;

  /// Entry-surface string: onboardingFocusSubtitle
  ///
  /// In en, this message translates to:
  /// **'Sets the default for every quiz. You can change it on any quiz.'**
  String get onboardingFocusSubtitle;

  /// Entry-surface string: contentMovies
  ///
  /// In en, this message translates to:
  /// **'Movies'**
  String get contentMovies;

  /// Entry-surface string: contentBooks
  ///
  /// In en, this message translates to:
  /// **'Books'**
  String get contentBooks;

  /// Entry-surface string: contentMusic
  ///
  /// In en, this message translates to:
  /// **'Music'**
  String get contentMusic;

  /// Entry-surface string: contentMix
  ///
  /// In en, this message translates to:
  /// **'A mix'**
  String get contentMix;

  /// Entry-surface string: onboardingAvoidEyebrow
  ///
  /// In en, this message translates to:
  /// **'Anything to skip?'**
  String get onboardingAvoidEyebrow;

  /// Entry-surface string: onboardingAvoidTitle
  ///
  /// In en, this message translates to:
  /// **'Genres you\'d rather never see.'**
  String get onboardingAvoidTitle;

  /// Entry-surface string: onboardingAvoidSubtitle
  ///
  /// In en, this message translates to:
  /// **'Tap any to add a hard \"don\'t recommend\" rule. Skip the step if nothing comes to mind.'**
  String get onboardingAvoidSubtitle;

  /// Entry-surface string: onboardingRemindersEyebrow
  ///
  /// In en, this message translates to:
  /// **'Reminders'**
  String get onboardingRemindersEyebrow;

  /// Entry-surface string: onboardingRemindersTitle
  ///
  /// In en, this message translates to:
  /// **'Want a weekly fresh-picks nudge?'**
  String get onboardingRemindersTitle;

  /// Entry-surface string: onboardingRemindersSubtitle
  ///
  /// In en, this message translates to:
  /// **'One quiet notification per week. We\'ll also nudge you if you\'ve got things in progress.'**
  String get onboardingRemindersSubtitle;

  /// Entry-surface string: remindersOff
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get remindersOff;

  /// Entry-surface string: remindersWeekly
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get remindersWeekly;

  /// Entry-surface string: onboardingRemindersOnHint
  ///
  /// In en, this message translates to:
  /// **'We\'ll ask permission to send notifications when you finish.'**
  String get onboardingRemindersOnHint;

  /// Entry-surface string: onboardingRemindersOffHint
  ///
  /// In en, this message translates to:
  /// **'You can turn this on anytime in Settings → Notifications.'**
  String get onboardingRemindersOffHint;

  /// Bottom-nav label: navHome
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// Bottom-nav label: navLibrary
  ///
  /// In en, this message translates to:
  /// **'Library'**
  String get navLibrary;

  /// Bottom-nav label: navDiscover
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get navDiscover;

  /// Bottom-nav label: navHistory
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get navHistory;

  /// Bottom-nav label: navProfile
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// Onboarding review step: onboardingReviewEyebrow
  ///
  /// In en, this message translates to:
  /// **'One last look'**
  String get onboardingReviewEyebrow;

  /// Onboarding review step: onboardingReviewTitle
  ///
  /// In en, this message translates to:
  /// **'Does this look right?'**
  String get onboardingReviewTitle;

  /// Onboarding review step: onboardingReviewSubtitle
  ///
  /// In en, this message translates to:
  /// **'Edit anything you\'d like to change before we save it.'**
  String get onboardingReviewSubtitle;

  /// Onboarding review step: reviewEdit
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get reviewEdit;

  /// Onboarding review step: reviewNone
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get reviewNone;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'de',
    'en',
    'es',
    'fr',
    'it',
    'ja',
    'ko',
    'nl',
    'pt',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'it':
      return AppLocalizationsIt();
    case 'ja':
      return AppLocalizationsJa();
    case 'ko':
      return AppLocalizationsKo();
    case 'nl':
      return AppLocalizationsNl();
    case 'pt':
      return AppLocalizationsPt();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
