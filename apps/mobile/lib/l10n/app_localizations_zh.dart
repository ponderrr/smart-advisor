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
  String get languageSystemDefault => '系统默认';

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

  @override
  String get getStartedHeadline => '挑一个\n值得你今晚的选择。';

  @override
  String get getStartedBody => '电影、书籍、音乐。告诉我们你的心情，获得契合的推荐——并附上一句理由。';

  @override
  String get getStartedPrimary => '开始';

  @override
  String get getStartedSecondary => '我已有账户';

  @override
  String get closePreview => '关闭预览';

  @override
  String get finish => '完成';

  @override
  String get onboardingNameEyebrow => '先从这里开始';

  @override
  String get onboardingNameTitle => '我们该怎么称呼你？';

  @override
  String get onboardingNameSubtitle => '展示推荐时我们会用这个名字称呼你。';

  @override
  String get onboardingFocusEyebrow => '你想要哪类推荐';

  @override
  String get onboardingFocusTitle => '电影、书籍、音乐，还是全都要？';

  @override
  String get onboardingFocusSubtitle => '设定每次测验的默认项。你可以在任何测验中更改。';

  @override
  String get contentMovies => '电影';

  @override
  String get contentBooks => '书籍';

  @override
  String get contentMusic => '音乐';

  @override
  String get contentMix => '混合';

  @override
  String get onboardingAvoidEyebrow => '有什么要跳过的吗？';

  @override
  String get onboardingAvoidTitle => '你宁愿永远不见的类型。';

  @override
  String get onboardingAvoidSubtitle => '点按任意项即可添加一条严格的\"不推荐\"规则。如果想不到，可跳过此步。';

  @override
  String get onboardingRemindersEyebrow => '提醒';

  @override
  String get onboardingRemindersTitle => '想每周收到一次新推荐提醒吗？';

  @override
  String get onboardingRemindersSubtitle => '每周一条安静的通知。如果你有未完成的内容，我们也会提醒你。';

  @override
  String get remindersOff => '关闭';

  @override
  String get remindersWeekly => '每周';

  @override
  String get onboardingRemindersOnHint => '完成时我们会请求发送通知的权限。';

  @override
  String get onboardingRemindersOffHint => '你可以随时在设置 → 通知中开启。';

  @override
  String get navHome => '主页';

  @override
  String get navLibrary => '收藏库';

  @override
  String get navDiscover => '发现';

  @override
  String get navHistory => '历史';

  @override
  String get navProfile => '个人资料';

  @override
  String get onboardingReviewEyebrow => '最后确认';

  @override
  String get onboardingReviewTitle => '这样对吗？';

  @override
  String get onboardingReviewSubtitle => '在保存前可编辑任何想修改的项。';

  @override
  String get reviewEdit => '编辑';

  @override
  String get reviewNone => '无';

  @override
  String get loading => '加载中';

  @override
  String get contactTitle => '联系我们';

  @override
  String get contactSectionGetInTouch => '取得联系';

  @override
  String get contactEmailSupport => '邮件支持';

  @override
  String get contactReportBug => '报告错误';

  @override
  String get contactReportBugSubtitle => '在 GitHub 上提交 issue';

  @override
  String get contactViewSource => '查看源代码';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor 是开源的';

  @override
  String get contactFooterNote => '我们会阅读每一条消息 — 请说明你使用的版本以及出现问题时正在做什么。';

  @override
  String get contactEmailSubject => 'Smart Advisor — 支持';

  @override
  String get appearanceTitle => '外观';

  @override
  String get themeLabel => '主题';

  @override
  String get themeSystem => '系统';

  @override
  String get themeLight => '浅色';

  @override
  String get themeDark => '深色';

  @override
  String get amoledDarkTitle => 'AMOLED 深色';

  @override
  String get amoledDarkSubtitle => '深色模式下使用纯黑色表面。';

  @override
  String get notificationsTitle => '通知';

  @override
  String get notificationsWeeklyReminder => '每周测验提醒';

  @override
  String get notificationsWeeklyOnHeading => '每周提醒已开启';

  @override
  String get notificationsWeeklyOnBody => '我们会每周提醒你发现新内容。';

  @override
  String get notificationsYourDataSection => '你的数据';

  @override
  String get notificationsYearInReview => '你的年度回顾';

  @override
  String get notificationsMonthInReview => '本月回顾';

  @override
  String get blockedPeopleTitle => '已屏蔽的人';

  @override
  String get blockedLoadError => '无法加载你的屏蔽列表。';

  @override
  String get blockedEmptyTitle => '没有屏蔽任何人';

  @override
  String get blockedEmptyBody => '当你从动态中屏蔽某人时，他们会出现在这里，方便你撤销。';

  @override
  String get blockedUnblock => '取消屏蔽';

  @override
  String blockedUnblockedToast(String handle) {
    return '已取消屏蔽 @$handle。';
  }

  @override
  String get filedReportsTitle => '已提交的举报';

  @override
  String get filedReportsLoadError => '无法加载你的举报。';

  @override
  String get filedReportsEmptyTitle => '没有举报';

  @override
  String get filedReportsEmptyBody => '你标记为审核的帖子和评论会显示在这里。';

  @override
  String get filedReportsOnPost => '关于一个帖子';

  @override
  String get filedReportsOnComment => '关于一条评论';

  @override
  String get filedReportsContentRemoved => '内容已删除';

  @override
  String get filedReportsUnderReview => '审核中';

  @override
  String get profileUnavailableTitle => '无法访问该资料';

  @override
  String get profileUnavailableBody => '可能已被删除，或链接错误。';

  @override
  String get profileUnavailableBack => '返回信息流';

  @override
  String get reportPostTitle => '举报此帖子';

  @override
  String get reportCommentTitle => '举报此评论';

  @override
  String get reportSubheading => '告诉我们原因，团队会进行审核。';

  @override
  String get reportReasonSpam => '垃圾内容';

  @override
  String get reportReasonHarassment => '骚扰或欺凌';

  @override
  String get reportReasonHate => '仇恨言论或符号';

  @override
  String get reportReasonViolence => '暴力或威胁';

  @override
  String get reportReasonSexual => '性或色情内容';

  @override
  String get reportReasonMisinformation => '虚假信息';

  @override
  String get reportReasonOther => '其他';

  @override
  String get reportDetailsLabel => '添加详情（可选）';

  @override
  String get reportDetailsHint => '简短说明有助于我们优先处理。';

  @override
  String get reportSubmit => '提交举报';

  @override
  String get reportThanks => '谢谢 — 我们会查看的。';

  @override
  String get reportError => '无法发送举报，请重试。';

  @override
  String get notificationsGroupQuizExpiringTitle => '群答题即将截止';

  @override
  String get notificationsGroupQuizExpiringSub => '在答题截止前收到提醒。';

  @override
  String get notificationsInProgressTitle => '完成你开始的事';

  @override
  String get notificationsInProgressSub => '为进行中的内容提供每周提醒。';
}
