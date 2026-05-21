// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class AppLocalizationsKo extends AppLocalizations {
  AppLocalizationsKo([String locale = 'ko']) : super(locale);

  @override
  String get languageName => '한국어';

  @override
  String get languageStepEyebrow => '언어';

  @override
  String get languageStepTitle => '언어를 선택하세요';

  @override
  String get languageStepSubtitle => '선택한 언어에 맞게 앱 인터페이스를 번역합니다.';

  @override
  String get back => '뒤로';

  @override
  String get next => '다음';

  @override
  String get skipForNow => '나중에 하기';
}
