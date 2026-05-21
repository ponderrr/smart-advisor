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
}
