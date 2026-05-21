// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get languageName => '中文';

  @override
  String get languageStepEyebrow => '语言';

  @override
  String get languageStepTitle => '选择你的语言';

  @override
  String get languageStepSubtitle => '我们会将应用界面翻译为对应语言。';

  @override
  String get back => '返回';

  @override
  String get next => '下一步';

  @override
  String get skipForNow => '暂时跳过';
}
