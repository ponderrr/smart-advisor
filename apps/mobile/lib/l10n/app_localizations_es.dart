// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get languageName => 'Español';

  @override
  String get languageSystemDefault => 'Predeterminado del sistema';

  @override
  String get languageStepEyebrow => 'Idioma';

  @override
  String get languageStepTitle => 'Elige tu idioma';

  @override
  String get languageStepSubtitle =>
      'Traduciremos la interfaz de la app para que coincida.';

  @override
  String get back => 'Atrás';

  @override
  String get next => 'Siguiente';

  @override
  String get skipForNow => 'Omitir por ahora';

  @override
  String get getStartedHeadline => 'Elige algo que\nvalga tu noche.';

  @override
  String get getStartedBody =>
      'Películas. Libros. Música. Dinos tu estado de ánimo y recibe una elección que encaje, con una razón en una línea.';

  @override
  String get getStartedPrimary => 'Empezar';

  @override
  String get getStartedSecondary => 'Ya tengo una cuenta';

  @override
  String get closePreview => 'Cerrar vista previa';

  @override
  String get finish => 'Finalizar';

  @override
  String get onboardingNameEyebrow => 'Lo primero es lo primero';

  @override
  String get onboardingNameTitle => '¿Cómo deberíamos llamarte?';

  @override
  String get onboardingNameSubtitle =>
      'Te saludaremos con este nombre cuando mostremos recomendaciones.';

  @override
  String get onboardingFocusEyebrow => 'Para qué quieres recomendaciones';

  @override
  String get onboardingFocusTitle => '¿Películas, libros, música o las tres?';

  @override
  String get onboardingFocusSubtitle =>
      'Define el valor por defecto de cada cuestionario. Puedes cambiarlo en cualquiera.';

  @override
  String get contentMovies => 'Películas';

  @override
  String get contentBooks => 'Libros';

  @override
  String get contentMusic => 'Música';

  @override
  String get contentMix => 'Una mezcla';

  @override
  String get onboardingAvoidEyebrow => '¿Algo que evitar?';

  @override
  String get onboardingAvoidTitle => 'Géneros que preferirías no ver nunca.';

  @override
  String get onboardingAvoidSubtitle =>
      'Toca cualquiera para añadir una regla estricta de \"no recomendar\". Omite el paso si no se te ocurre nada.';

  @override
  String get onboardingRemindersEyebrow => 'Recordatorios';

  @override
  String get onboardingRemindersTitle =>
      '¿Quieres un aviso semanal de nuevas recomendaciones?';

  @override
  String get onboardingRemindersSubtitle =>
      'Una notificación discreta por semana. También te avisaremos si tienes cosas pendientes.';

  @override
  String get remindersOff => 'Desactivado';

  @override
  String get remindersWeekly => 'Semanal';

  @override
  String get onboardingRemindersOnHint =>
      'Te pediremos permiso para enviar notificaciones al terminar.';

  @override
  String get onboardingRemindersOffHint =>
      'Puedes activarlo cuando quieras en Ajustes → Notificaciones.';
}
