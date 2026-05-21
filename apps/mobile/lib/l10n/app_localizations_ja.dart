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

  @override
  String get getStartedHeadline => 'あなたの夜に\nふさわしい一本を。';

  @override
  String get getStartedBody => '映画。本。音楽。今の気分を教えてくれれば、ぴったりの一作を一言の理由つきで提案します。';

  @override
  String get getStartedPrimary => 'はじめる';

  @override
  String get getStartedSecondary => 'すでにアカウントを持っています';

  @override
  String get closePreview => 'プレビューを閉じる';

  @override
  String get finish => '完了';

  @override
  String get onboardingNameEyebrow => 'まずはじめに';

  @override
  String get onboardingNameTitle => '何とお呼びすればいいですか？';

  @override
  String get onboardingNameSubtitle => 'おすすめを表示するときにこの名前で呼びかけます。';

  @override
  String get onboardingFocusEyebrow => '何のおすすめが欲しいか';

  @override
  String get onboardingFocusTitle => '映画、本、音楽、それとも全部？';

  @override
  String get onboardingFocusSubtitle => 'すべてのクイズの初期設定になります。クイズごとに変更できます。';

  @override
  String get contentMovies => '映画';

  @override
  String get contentBooks => '本';

  @override
  String get contentMusic => '音楽';

  @override
  String get contentMix => 'ミックス';

  @override
  String get onboardingAvoidEyebrow => '避けたいものは？';

  @override
  String get onboardingAvoidTitle => '絶対に見たくないジャンル。';

  @override
  String get onboardingAvoidSubtitle =>
      'タップすると「おすすめしない」ルールを追加できます。思いつかなければスキップしてください。';

  @override
  String get onboardingRemindersEyebrow => 'リマインダー';

  @override
  String get onboardingRemindersTitle => '毎週、新しいおすすめのお知らせを受け取りますか？';

  @override
  String get onboardingRemindersSubtitle => '週に1回の控えめな通知です。進行中のものがあればお知らせもします。';

  @override
  String get remindersOff => 'オフ';

  @override
  String get remindersWeekly => '毎週';

  @override
  String get onboardingRemindersOnHint => '完了時に通知送信の許可をお願いします。';

  @override
  String get onboardingRemindersOffHint => '設定 → 通知でいつでもオンにできます。';

  @override
  String get navHome => 'ホーム';

  @override
  String get navLibrary => 'ライブラリ';

  @override
  String get navDiscover => '見つける';

  @override
  String get navHistory => '履歴';

  @override
  String get navProfile => 'プロフィール';

  @override
  String get onboardingReviewEyebrow => '最終確認';

  @override
  String get onboardingReviewTitle => 'これで合っていますか？';

  @override
  String get onboardingReviewSubtitle => '保存する前に変更したい項目を編集できます。';

  @override
  String get reviewEdit => '編集';

  @override
  String get reviewNone => 'なし';
}
