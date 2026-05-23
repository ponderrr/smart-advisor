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

  @override
  String get navHome => 'Inicio';

  @override
  String get navLibrary => 'Biblioteca';

  @override
  String get navDiscover => 'Descubrir';

  @override
  String get navHistory => 'Historial';

  @override
  String get navProfile => 'Perfil';

  @override
  String get onboardingReviewEyebrow => 'Una última mirada';

  @override
  String get onboardingReviewTitle => '¿Se ve bien?';

  @override
  String get onboardingReviewSubtitle =>
      'Edita lo que quieras cambiar antes de guardarlo.';

  @override
  String get reviewEdit => 'Editar';

  @override
  String get reviewNone => 'Ninguno';

  @override
  String get loading => 'Cargando';

  @override
  String get contactTitle => 'Contáctanos';

  @override
  String get contactSectionGetInTouch => 'Ponte en contacto';

  @override
  String get contactEmailSupport => 'Soporte por correo';

  @override
  String get contactReportBug => 'Reportar un error';

  @override
  String get contactReportBugSubtitle => 'Abrir un issue en GitHub';

  @override
  String get contactViewSource => 'Ver el código';

  @override
  String get contactViewSourceSubtitle => 'Smart Advisor es código abierto';

  @override
  String get contactFooterNote =>
      'Leemos cada mensaje — por favor menciona qué versión usas y qué hacías cuando algo salió mal.';

  @override
  String get contactEmailSubject => 'Smart Advisor — soporte';

  @override
  String get appearanceTitle => 'Apariencia';

  @override
  String get themeLabel => 'Tema';

  @override
  String get themeSystem => 'Sistema';

  @override
  String get themeLight => 'Claro';

  @override
  String get themeDark => 'Oscuro';

  @override
  String get amoledDarkTitle => 'Negro AMOLED';

  @override
  String get amoledDarkSubtitle => 'Superficies negras puras en modo oscuro.';

  @override
  String get notificationsTitle => 'Notificaciones';

  @override
  String get notificationsWeeklyReminder => 'Recordatorio semanal del quiz';

  @override
  String get notificationsWeeklyOnHeading => 'Recordatorio semanal activado';

  @override
  String get notificationsWeeklyOnBody =>
      'Te avisaremos cada semana para descubrir algo nuevo.';

  @override
  String get notificationsYourDataSection => 'Tus datos';

  @override
  String get notificationsYearInReview => 'Tu año en resumen';

  @override
  String get notificationsMonthInReview => 'Este mes en resumen';

  @override
  String get blockedPeopleTitle => 'Personas bloqueadas';

  @override
  String get blockedLoadError => 'No se pudo cargar tu lista de bloqueos.';

  @override
  String get blockedEmptyTitle => 'No hay nadie bloqueado';

  @override
  String get blockedEmptyBody =>
      'Cuando bloquees a alguien desde el feed, aparecerá aquí para que puedas deshacerlo.';

  @override
  String get blockedUnblock => 'Desbloquear';

  @override
  String blockedUnblockedToast(String handle) {
    return '@$handle desbloqueado.';
  }

  @override
  String get filedReportsTitle => 'Reportes que has enviado';

  @override
  String get filedReportsLoadError => 'No se pudieron cargar tus reportes.';

  @override
  String get filedReportsEmptyTitle => 'Sin reportes enviados';

  @override
  String get filedReportsEmptyBody =>
      'Las publicaciones y comentarios que marques para revisión aparecerán aquí.';

  @override
  String get filedReportsOnPost => 'En una publicación';

  @override
  String get filedReportsOnComment => 'En un comentario';

  @override
  String get filedReportsContentRemoved => 'Contenido eliminado';

  @override
  String get filedReportsUnderReview => 'En revisión';

  @override
  String get profileUnavailableTitle => 'Perfil no disponible';

  @override
  String get profileUnavailableBody =>
      'Puede que se haya eliminado o el enlace sea incorrecto.';

  @override
  String get profileUnavailableBack => 'Volver al feed';

  @override
  String get reportPostTitle => 'Reportar esta publicación';

  @override
  String get reportCommentTitle => 'Reportar este comentario';

  @override
  String get reportSubheading =>
      'Dinos por qué para que nuestro equipo pueda revisarlo.';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonHarassment => 'Acoso o intimidación';

  @override
  String get reportReasonHate => 'Discurso o símbolos de odio';

  @override
  String get reportReasonViolence => 'Violencia o amenazas';

  @override
  String get reportReasonSexual => 'Contenido sexual o explícito';

  @override
  String get reportReasonMisinformation => 'Información falsa';

  @override
  String get reportReasonOther => 'Otra cosa';

  @override
  String get reportDetailsLabel => 'Añadir detalles (opcional)';

  @override
  String get reportDetailsHint => 'Una nota corta nos ayuda a priorizar.';

  @override
  String get reportSubmit => 'Enviar reporte';

  @override
  String get reportThanks => 'Gracias — lo revisaremos.';

  @override
  String get reportError =>
      'No se pudo enviar ese reporte. Inténtalo de nuevo.';

  @override
  String get notificationsGroupQuizExpiringTitle =>
      'Respuesta del quiz por expirar';

  @override
  String get notificationsGroupQuizExpiringSub =>
      'Recibe un aviso antes de la fecha límite para responder.';

  @override
  String get notificationsInProgressTitle => 'Termina lo que empezaste';

  @override
  String get notificationsInProgressSub =>
      'Aviso semanal sobre selecciones aún en curso.';
}
