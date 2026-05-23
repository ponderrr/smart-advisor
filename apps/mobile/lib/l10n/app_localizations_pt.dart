// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get languageName => 'Português';

  @override
  String get languageSystemDefault => 'Padrão do sistema';

  @override
  String get languageStepEyebrow => 'Idioma';

  @override
  String get languageStepTitle => 'Escolha o seu idioma';

  @override
  String get languageStepSubtitle =>
      'Vamos traduzir a interface do app para corresponder.';

  @override
  String get back => 'Voltar';

  @override
  String get next => 'Avançar';

  @override
  String get skipForNow => 'Ignorar por agora';

  @override
  String get getStartedHeadline => 'Escolha algo que\nvalha a sua noite.';

  @override
  String get getStartedBody =>
      'Filmes. Livros. Música. Conte-nos o seu humor e receba uma escolha que combina — com um motivo em uma linha.';

  @override
  String get getStartedPrimary => 'Começar';

  @override
  String get getStartedSecondary => 'Já tenho uma conta';

  @override
  String get closePreview => 'Fechar pré-visualização';

  @override
  String get finish => 'Concluir';

  @override
  String get onboardingNameEyebrow => 'Primeiro o mais importante';

  @override
  String get onboardingNameTitle => 'Como devemos chamá-lo?';

  @override
  String get onboardingNameSubtitle =>
      'Vamos cumprimentá-lo assim ao mostrar recomendações.';

  @override
  String get onboardingFocusEyebrow => 'Para que você quer recomendações';

  @override
  String get onboardingFocusTitle => 'Filmes, livros, música ou os três?';

  @override
  String get onboardingFocusSubtitle =>
      'Define o padrão de cada questionário. Você pode mudar a qualquer momento.';

  @override
  String get contentMovies => 'Filmes';

  @override
  String get contentBooks => 'Livros';

  @override
  String get contentMusic => 'Música';

  @override
  String get contentMix => 'Uma mistura';

  @override
  String get onboardingAvoidEyebrow => 'Algo a evitar?';

  @override
  String get onboardingAvoidTitle => 'Gêneros que você prefere nunca ver.';

  @override
  String get onboardingAvoidSubtitle =>
      'Toque em qualquer um para adicionar uma regra rígida de \"não recomendar\". Pule a etapa se nada vier à mente.';

  @override
  String get onboardingRemindersEyebrow => 'Lembretes';

  @override
  String get onboardingRemindersTitle =>
      'Quer um lembrete semanal de novas recomendações?';

  @override
  String get onboardingRemindersSubtitle =>
      'Uma notificação discreta por semana. Também avisaremos se você tiver coisas em andamento.';

  @override
  String get remindersOff => 'Desativado';

  @override
  String get remindersWeekly => 'Semanal';

  @override
  String get onboardingRemindersOnHint =>
      'Pediremos permissão para enviar notificações ao concluir.';

  @override
  String get onboardingRemindersOffHint =>
      'Você pode ativar isso quando quiser em Configurações → Notificações.';

  @override
  String get navHome => 'Início';

  @override
  String get navLibrary => 'Biblioteca';

  @override
  String get navDiscover => 'Descobrir';

  @override
  String get navHistory => 'Histórico';

  @override
  String get navProfile => 'Perfil';

  @override
  String get onboardingReviewEyebrow => 'Uma última olhada';

  @override
  String get onboardingReviewTitle => 'Está tudo certo?';

  @override
  String get onboardingReviewSubtitle =>
      'Edite o que quiser antes de salvarmos.';

  @override
  String get reviewEdit => 'Editar';

  @override
  String get reviewNone => 'Nenhum';

  @override
  String get loading => 'Carregando';

  @override
  String get contactTitle => 'Fale conosco';

  @override
  String get contactSectionGetInTouch => 'Entre em contato';

  @override
  String get contactEmailSupport => 'Suporte por e-mail';

  @override
  String get contactReportBug => 'Reportar um bug';

  @override
  String get contactReportBugSubtitle => 'Abrir uma issue no GitHub';

  @override
  String get contactViewSource => 'Ver o código';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor é código aberto';

  @override
  String get contactFooterNote =>
      'Lemos cada mensagem — por favor mencione qual versão está usando e o que estava fazendo quando algo deu errado.';

  @override
  String get contactEmailSubject => 'Smart Advisor — suporte';

  @override
  String get appearanceTitle => 'Aparência';

  @override
  String get themeLabel => 'Tema';

  @override
  String get themeSystem => 'Sistema';

  @override
  String get themeLight => 'Claro';

  @override
  String get themeDark => 'Escuro';

  @override
  String get amoledDarkTitle => 'Preto AMOLED';

  @override
  String get amoledDarkSubtitle => 'Superfícies preto puro no modo escuro.';

  @override
  String get notificationsTitle => 'Notificações';

  @override
  String get notificationsWeeklyReminder => 'Lembrete semanal do quiz';

  @override
  String get notificationsWeeklyOnHeading => 'Lembrete semanal ativado';

  @override
  String get notificationsWeeklyOnBody =>
      'Vamos te lembrar semanalmente de descobrir algo.';

  @override
  String get notificationsYourDataSection => 'Seus dados';

  @override
  String get notificationsYearInReview => 'Seu ano em retrospectiva';

  @override
  String get notificationsMonthInReview => 'Este mês em retrospectiva';

  @override
  String get blockedPeopleTitle => 'Pessoas bloqueadas';

  @override
  String get blockedLoadError =>
      'Não foi possível carregar sua lista de bloqueios.';

  @override
  String get blockedEmptyTitle => 'Ninguém bloqueado';

  @override
  String get blockedEmptyBody =>
      'Quando você bloqueia alguém pelo feed, ela aparece aqui para você desfazer.';

  @override
  String get blockedUnblock => 'Desbloquear';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle desbloqueado.';
  }

  @override
  String get filedReportsTitle => 'Denúncias enviadas';

  @override
  String get filedReportsLoadError =>
      'Não foi possível carregar suas denúncias.';

  @override
  String get filedReportsEmptyTitle => 'Nenhuma denúncia enviada';

  @override
  String get filedReportsEmptyBody =>
      'Posts e comentários que você sinalizar para revisão aparecerão aqui.';

  @override
  String get filedReportsOnPost => 'Em um post';

  @override
  String get filedReportsOnComment => 'Em um comentário';

  @override
  String get filedReportsContentRemoved => 'Conteúdo removido';

  @override
  String get filedReportsUnderReview => 'Em análise';

  @override
  String get filedReportsReviewed => 'Analisado';

  @override
  String get filedReportsDismissed => 'Rejeitado';

  @override
  String get profileUnavailableTitle => 'Perfil indisponível';

  @override
  String get profileUnavailableBody =>
      'Pode ter sido removido, ou o link está errado.';

  @override
  String get profileUnavailableBack => 'Voltar ao feed';

  @override
  String get reportPostTitle => 'Denunciar este post';

  @override
  String get reportCommentTitle => 'Denunciar este comentário';

  @override
  String get reportSubheading =>
      'Diga-nos o motivo para nossa equipe analisar.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Assédio ou bullying';

  @override
  String get reportReasonHate => 'Discurso ou símbolos de ódio';

  @override
  String get reportReasonViolence => 'Violência ou ameaças';

  @override
  String get reportReasonSexual => 'Conteúdo sexual ou explícito';

  @override
  String get reportReasonMisinformation => 'Informações falsas';

  @override
  String get reportReasonOther => 'Outra coisa';

  @override
  String get reportDetailsLabel => 'Adicionar detalhes (opcional)';

  @override
  String get reportDetailsHint => 'Uma observação curta nos ajuda a priorizar.';

  @override
  String get reportSubmit => 'Enviar denúncia';

  @override
  String get reportThanks => 'Obrigado — vamos analisar.';

  @override
  String get reportError =>
      'Não foi possível enviar a denúncia. Tente novamente.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Resposta do quiz expirando';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Receba um aviso antes do prazo para responder.';

  @override
  String get notificationsInProgressTitle => 'Termine o que começou';

  @override
  String get notificationsInProgressSub =>
      'Lembrete semanal para itens ainda em andamento.';
}
