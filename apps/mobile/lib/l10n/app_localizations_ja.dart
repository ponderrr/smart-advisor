// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get languageName => '日本語';

  @override
  String get languageSystemDefault => 'システムのデフォルト';

  @override
  String get languageStepEyebrow => '言語';

  @override
  String get languageStepTitle => '言語を選択';

  @override
  String get languageStepSubtitle => 'アプリの表示を選択した言語に翻訳します。';

  @override
  String get back => '戻る';

  @override
  String get next => '次へ';

  @override
  String get skipForNow => '今はスキップ';
}
