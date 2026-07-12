// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get loginWelcomeBack => 'Bienvenido de nuevo';

  @override
  String get loginSignInSubtitle => 'Inicia sesión en tu cuenta';

  @override
  String get loginEmailLabel => 'Correo electrónico';

  @override
  String get loginEmailValidator => 'Introduce un correo válido';

  @override
  String get loginPasswordLabel => 'Contraseña';

  @override
  String get loginPasswordValidator => 'Introduce tu contraseña';

  @override
  String get loginForgotPassword => '¿Olvidaste tu contraseña?';

  @override
  String get loginSignInButton => 'Iniciar sesión';

  @override
  String get loginBiometricButton => 'Acceder con biometría';

  @override
  String get loginNoAccountPrompt => '¿No tienes cuenta? ';

  @override
  String get loginSignUpLink => 'Regístrate';

  @override
  String get registerStep1Title => '¿Cómo te llamas?';

  @override
  String get registerStep1Subtitle => 'Así aparecerás ante los demás.';

  @override
  String get registerFullNameLabel => 'Nombre completo';

  @override
  String get registerContinueButton => 'Continuar';

  @override
  String get registerStep2Title => 'Soy...';

  @override
  String get registerStep2Subtitle =>
      'Elige tu rol para la experiencia adecuada.';

  @override
  String get registerRoleStudentTitle => 'Estudiante';

  @override
  String get registerRoleStudentSubtitle => 'Sigo mis notas y gano recompensas';

  @override
  String get registerRoleParentTitle => 'Padre/Madre';

  @override
  String get registerRoleParentSubtitle =>
      'Establezco recompensas y monitorizo el progreso de mi hijo';

  @override
  String get registerStep3Title => 'Crea tu cuenta';

  @override
  String get registerStep3Subtitle => '¡Casi listo!';

  @override
  String get registerEmailLabel => 'Correo electrónico';

  @override
  String get registerPasswordLabel => 'Contraseña';

  @override
  String get registerConfirmPasswordLabel => 'Confirmar contraseña';

  @override
  String get registerCreateAccountButton => 'Crear cuenta';

  @override
  String get registerAlreadyHaveAccount => '¿Ya tienes cuenta? ';

  @override
  String get registerSignInLink => 'Inicia sesión';

  @override
  String get registerPasswordsDoNotMatch => 'Las contraseñas no coinciden';

  @override
  String get registerPasswordTooShort =>
      'La contraseña debe tener al menos 12 caracteres';

  @override
  String get registerFailed => 'El registro falló. Inténtalo de nuevo.';

  @override
  String get forgotPasswordAppBarTitle => 'Restablecer contraseña';

  @override
  String get forgotPasswordStep1Title => '¿Olvidaste tu contraseña?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Introduce tu correo y te enviaremos un código de restablecimiento.';

  @override
  String get forgotPasswordEmailLabel => 'Correo electrónico';

  @override
  String get forgotPasswordSendCodeButton => 'Enviar código';

  @override
  String get forgotPasswordStep2Title => 'Revisa tu correo';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Introduce el código que enviamos a $email.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Código de restablecimiento';

  @override
  String get forgotPasswordNewPasswordLabel => 'Nueva contraseña';

  @override
  String get forgotPasswordResetButton => 'Restablecer contraseña';

  @override
  String get forgotPasswordResendCode => 'Reenviar código';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Contraseña actualizada. Inicia sesión con tu nueva contraseña.';

  @override
  String get verifyEmailAppBarTitle => 'Verificar correo';

  @override
  String get verifyEmailTitle => 'Revisa tu correo';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Introduce el código de 6 dígitos enviado a\n$email';
  }

  @override
  String get verifyEmailButton => 'Verificar';

  @override
  String get verifyEmailFailed => 'La verificación falló. Inténtalo de nuevo.';

  @override
  String get onboardingSkip => 'Omitir';

  @override
  String get onboardingNext => 'Siguiente';

  @override
  String get onboardingGetStarted => 'Comenzar';

  @override
  String get onboardingNoAccountPrompt => '¿No tienes cuenta? ';

  @override
  String get onboardingSignUpLink => 'Regístrate';

  @override
  String get onboardingPage1Title => 'Convierte las notas\nen recompensas';

  @override
  String get onboardingPage1Body =>
      'Los estudiantes ganan puntos de bonificación por cada buena nota. Los padres establecen las recompensas. Todos ganan.';

  @override
  String get onboardingPage2Title => 'Fotografía una nota,\ngana al instante';

  @override
  String get onboardingPage2Body =>
      'Fotografía cualquier trabajo escolar calificado. La app lee la asignatura y la nota automáticamente.';

  @override
  String get onboardingPage3Title => 'Sigue el progreso\njuntos';

  @override
  String get onboardingPage3Body =>
      'Padres y estudiantes ven la misma información — notas, bonificaciones y tendencias a lo largo del tiempo.';

  @override
  String get settingsTitle => 'Ajustes';

  @override
  String get settingsSectionPreferences => 'Preferencias';

  @override
  String get settingsSectionAccount => 'Cuenta';

  @override
  String get settingsSectionConnectedParents => 'Padres conectados';

  @override
  String get settingsSectionApp => 'Aplicación';

  @override
  String get settingsAppearanceLabel => 'Apariencia';

  @override
  String get settingsThemeSystem => 'Sistema';

  @override
  String get settingsThemeLight => 'Claro';

  @override
  String get settingsThemeDark => 'Oscuro';

  @override
  String get settingsLanguageLabel => 'Idioma';

  @override
  String get settingsLanguageAuto => 'Auto';

  @override
  String get settingsLanguageAutoSystem => 'Auto (Sistema)';

  @override
  String get settingsEditProfile => 'Editar perfil';

  @override
  String get settingsChangePassword => 'Cambiar contraseña';

  @override
  String get settingsChangeEmail => 'Cambiar correo';

  @override
  String get settingsBiometricLogin => 'Inicio de sesión biométrico';

  @override
  String get settingsBiometricVerifyFailed =>
      'Verificación biométrica fallida. Inténtalo de nuevo.';

  @override
  String get settingsDeleteAccount => 'Eliminar cuenta';

  @override
  String get settingsDeleteAccountDialogTitle => 'Eliminar cuenta';

  @override
  String get settingsDeleteAccountDialogContent =>
      'Esto eliminará permanentemente tu cuenta y todos los datos. Esta acción no se puede deshacer.';

  @override
  String get settingsDeleteAccountConfirm => 'Eliminar cuenta';

  @override
  String get settingsCancel => 'Cancelar';

  @override
  String get settingsAbout => 'Acerca de';

  @override
  String get settingsLogOut => 'Cerrar sesión';

  @override
  String get settingsNoParentsConnected => 'Sin padres conectados';

  @override
  String get settingsScanQr => 'Escanear QR';

  @override
  String get settingsAddAnotherParent => 'Añadir otro padre';

  @override
  String get settingsScanParentQrTitle => 'Escanear QR del padre';

  @override
  String get settingsScanQrInstructions =>
      'Apunta la cámara al código QR mostrado en el dispositivo del padre';

  @override
  String settingsConnectedSince(String date) {
    return 'Conectado el $date';
  }

  @override
  String get settingsRemoveConnection => 'Eliminar conexión';

  @override
  String get settingsParentConnected => '¡Padre conectado!';

  @override
  String get settingsEditProfileTitle => 'Editar perfil';

  @override
  String get settingsFullName => 'Nombre completo';

  @override
  String get settingsNameCannotBeEmpty => 'El nombre no puede estar vacío';

  @override
  String get settingsProfileUpdated => 'Perfil actualizado';

  @override
  String get settingsChangePasswordTitle => 'Cambiar contraseña';

  @override
  String get settingsNewPassword => 'Nueva contraseña';

  @override
  String get settingsConfirmPassword => 'Confirmar contraseña';

  @override
  String get settingsEnterPassword => 'Introduce una contraseña';

  @override
  String get settingsMin12Chars => 'Mínimo 12 caracteres';

  @override
  String get settingsPasswordsDoNotMatch => 'Las contraseñas no coinciden';

  @override
  String get settingsPasswordChanged => 'Contraseña cambiada';

  @override
  String get settingsChangeEmailTitle => 'Cambiar correo';

  @override
  String get settingsNewEmailAddress => 'Nueva dirección de correo';

  @override
  String get settingsEnterEmail => 'Introduce un correo';

  @override
  String get settingsEnterValidEmail => 'Introduce un correo válido';

  @override
  String get settingsSendVerificationCode => 'Enviar código de verificación';

  @override
  String get settingsSending => 'Enviando…';

  @override
  String settingsCodeSentTo(String email) {
    return 'Hemos enviado un código de 6 dígitos a $email.';
  }

  @override
  String get settingsVerificationCode => 'Código de verificación';

  @override
  String get settingsEnter6DigitCode => 'Introduce el código de 6 dígitos';

  @override
  String get settingsEmailUpdated => 'Correo actualizado';

  @override
  String get settingsInvalidCode =>
      'Código inválido o expirado. Inténtalo de nuevo.';

  @override
  String get settingsSave => 'Guardar';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Error al eliminar la cuenta: $error';
  }

  @override
  String get settingsAboutLegalese =>
      'Seguimiento de recompensas por notas para estudiantes';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Configuración de notas';

  @override
  String get settingsGradingConfigSubtitle =>
      'Multiplicadores de nivel · ciclo de notas · ratio de bonificación';

  @override
  String get settingsGradeTierMultipliers => 'Multiplicadores de nivel de nota';

  @override
  String get settingsOngoingNotesCycle => 'Ciclo de notas en curso';

  @override
  String settingsEditMultiplier(String label) {
    return 'Editar multiplicador: $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Configuración para $childName';
  }

  @override
  String get settingsCycleType => 'Tipo de ciclo';

  @override
  String get settingsBonusRatio => 'Ratio de bonificación';

  @override
  String get settingsTierBestLabel => 'Excelente (Nota 1–2)';

  @override
  String get settingsTierSecondLabel => 'Bueno (Nota 3)';

  @override
  String get settingsTierThirdLabel => 'Suficiente (Nota 4)';

  @override
  String get settingsFailedToLoadChildren => 'No se pudieron cargar los hijos';

  @override
  String get settingsNoChildrenConnected => 'Sin hijos conectados';

  @override
  String dashboardHiName(String name) {
    return 'Hola $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Sigue tus notas, gana recompensas';

  @override
  String get dashboardThisWeek => 'Esta semana';

  @override
  String get dashboardRecentNotes => 'Notas recientes';

  @override
  String get dashboardSavedResults => 'Resultados guardados';

  @override
  String get dashboardQuickCalculate => 'Cálculo rápido';

  @override
  String get dashboardCouldNotLoadNotes => 'No se pudieron cargar las notas';

  @override
  String get dashboardNoNotesYet => 'Todavía no hay notas';

  @override
  String get dashboardCouldNotLoadResults =>
      'No se pudieron cargar los resultados';

  @override
  String get dashboardNoSavedResultsYet =>
      'Todavía no hay resultados guardados';

  @override
  String get calculatorTitle => 'Calculadora de notas';

  @override
  String get calculatorGradingSystem => 'Sistema de calificación';

  @override
  String get calculatorClass => 'Clase';

  @override
  String get calculatorTerm => 'Trimestre';

  @override
  String get calculatorSchoolYear => 'Año escolar';

  @override
  String get calculatorLabelOptional => 'Etiqueta (opcional)';

  @override
  String get calculatorGradePlanner => 'Planificador de notas';

  @override
  String get calculatorGradePlannerHint =>
      'Establece la clase y el trimestre arriba, luego toca «Añadir asignatura».';

  @override
  String get calculatorAddSubject => 'Añadir asignatura';

  @override
  String get calculatorSearchSubjects => 'Buscar asignaturas…';

  @override
  String get calculatorGradeLabel => 'Nota';

  @override
  String get calculatorWeightLabel => 'Peso';

  @override
  String get calculatorWeightTooltip =>
      'Mayor peso = más bonificación. Usa 2× para exámenes difíciles.';

  @override
  String get calculatorSelectSubjectValidator => 'Selecciona una asignatura';

  @override
  String get calculatorSelectGradeValidator => 'Selecciona una nota';

  @override
  String get calculatorCoreSubjects => 'Asignaturas principales';

  @override
  String get calculatorOther => 'Otras';

  @override
  String get calculatorTotalBonus => 'Bonificación total';

  @override
  String get calculatorSaveResult => 'Guardar resultado';

  @override
  String get calculatorResultSaved => '¡Resultado guardado!';

  @override
  String get calculatorSaveChanges => 'Guardar cambios';

  @override
  String get calculatorTierExcellent => 'Excelente';

  @override
  String get calculatorTierGood => 'Bueno';

  @override
  String get calculatorTierSatisfactory => 'Suficiente';

  @override
  String get calculatorTierBelow => 'Por debajo del umbral';

  @override
  String get calculatorSettingsTooltip => 'Ajustes';

  @override
  String get notesTitle => 'Notas';

  @override
  String get notesNoNotesYet => 'Todavía no hay notas';

  @override
  String get notesTapToCaptureFirst => 'Toca + para capturar tu primera nota';

  @override
  String get notesFailedToLoad => 'No se pudieron cargar las notas';

  @override
  String get notesRetry => 'Reintentar';

  @override
  String get notesViewCycleSummary => 'Ver resumen del ciclo';

  @override
  String get notesDeleteGradeTitle => 'Eliminar nota';

  @override
  String get notesDeleteGradeConfirm =>
      '¿Estás seguro de que quieres eliminar esta nota?';

  @override
  String get notesDelete => 'Eliminar';

  @override
  String get notesCancel => 'Cancelar';

  @override
  String get notesThisWeek => 'Esta semana';

  @override
  String get notesLastWeek => 'La semana pasada';

  @override
  String get noteDetailTitle => 'Detalle de nota';

  @override
  String get noteDetailCouldNotLoad => 'No se pudo cargar la nota';

  @override
  String get noteDetailNotFound => 'Nota no encontrada';

  @override
  String get noteDetailDateCaptured => 'Fecha de captura';

  @override
  String get noteDetailQualityTier => 'Nivel de calidad';

  @override
  String get noteDetailSettlement => 'Liquidación';

  @override
  String get noteDetailSettled => 'Liquidado';

  @override
  String get noteDetailPending => 'Pendiente';

  @override
  String get noteDetailTier1 => 'Nivel 1 — Excelente';

  @override
  String get noteDetailTier2 => 'Nivel 2 — Bueno';

  @override
  String get noteDetailTier3 => 'Nivel 3 — Suficiente';

  @override
  String get noteDetailTierBelow => 'Por debajo del umbral';

  @override
  String get noteDetailDeleteTitle => 'Eliminar nota';

  @override
  String get noteDetailDeleteConfirm =>
      '¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.';

  @override
  String get noteDetailDelete => 'Eliminar';

  @override
  String get noteDetailCancel => 'Cancelar';

  @override
  String get captureTitle => 'Capturar nota';

  @override
  String get capturePositionGrade =>
      'Coloca la nota de forma que sea claramente visible';

  @override
  String get captureChooseFromGallery => 'Elegir de la galería';

  @override
  String get captureTakePhoto => 'Tomar foto';

  @override
  String get captureLoadingEntry => 'Cargando entrada de nota...';

  @override
  String get captureEnterGrade => 'Introducir nota';

  @override
  String get captureSelectSubjectGrade =>
      'Selecciona la asignatura y el valor de la nota';

  @override
  String get captureSubjectLabel => 'Asignatura';

  @override
  String get captureGradeLabel => 'Nota';

  @override
  String get captureNoSubjectsLoaded => 'No hay asignaturas cargadas';

  @override
  String get captureSelectSubjectAndGrade =>
      'Selecciona una asignatura y una nota';

  @override
  String get captureSaveGrade => 'Guardar nota';

  @override
  String get captureCancel => 'Cancelar';

  @override
  String get cycleSummaryTitle => 'Resumen del ciclo';

  @override
  String get cycleSummaryCouldNotLoad => 'No se pudieron cargar las notas';

  @override
  String get cycleSummaryWeekly => 'Semanal';

  @override
  String get cycleSummaryNotesInCycle => 'Notas en este ciclo';

  @override
  String get cycleSummaryNoGrades => 'Sin notas en este período';

  @override
  String get cycleSummaryPositive => 'Positivo';

  @override
  String get cycleSummaryNet => 'Neto';

  @override
  String get resultsTitle => 'Resultados guardados';

  @override
  String get resultsFailedToLoad => 'No se pudieron cargar los resultados';

  @override
  String get resultsRetry => 'Reintentar';

  @override
  String get resultsNoResults => 'Todavía no hay resultados guardados';

  @override
  String get resultsUseCalculator =>
      'Usa la calculadora para guardar tu primer resultado trimestral.';

  @override
  String get resultsOpenCalculator => 'Abrir calculadora';

  @override
  String get termDetailTitle => 'Resultado trimestral';

  @override
  String get termDetailCouldNotLoad => 'No se pudo cargar el trimestre';

  @override
  String get termDetailNotFound => 'Trimestre no encontrado';

  @override
  String get termDetailAverage => 'Promedio';

  @override
  String get termDetailBonus => 'Bonificación';

  @override
  String get termDetailSubjects => 'Asignaturas';

  @override
  String get termDetailSubjectBreakdown => 'Desglose de asignaturas';

  @override
  String get insightsTitle => 'Análisis';

  @override
  String get insightsFailedToLoad => 'No se pudieron cargar los análisis';

  @override
  String get insightsRetry => 'Reintentar';

  @override
  String get insightsNoGradesYet => 'Todavía no hay notas';

  @override
  String get insightsAddGradesHint =>
      'Añade notas en la pestaña Notas para ver los análisis.';

  @override
  String get insightsBonusPointsLastMonths =>
      'Puntos de bonificación — Últimos 6 meses';

  @override
  String get insightsNoBonusPoints =>
      'Sin puntos de bonificación en los últimos 6 meses';

  @override
  String get insightsGradeDistribution => 'Distribución de notas';

  @override
  String get insightsThisWeek => 'Esta semana';

  @override
  String get insightsAllTime => 'Todo el tiempo';

  @override
  String get insightsGrades => 'Notas';

  @override
  String get insightsEarned => 'Ganados';

  @override
  String get insightsUnsettled => 'Sin liquidar';

  @override
  String get insightsTotalPts => 'Puntos totales';

  @override
  String get insightsPending => 'Pendiente';

  @override
  String get insightsTierBest => 'Excelente (1–1,4)';

  @override
  String get insightsTierGood => 'Bueno (1,5–2,4)';

  @override
  String get insightsTierOk => 'Suficiente (2,5–3,4)';

  @override
  String get insightsTierBelow => 'Insuficiente (3,5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Hola $name';
  }

  @override
  String get parentDashboardOverview => 'Resumen de tus hijos';

  @override
  String get parentDashboardSummary => 'Resumen';

  @override
  String get parentDashboardChildren => 'Hijos';

  @override
  String get parentDashboardPending => 'Pendiente';

  @override
  String get parentDashboardGrades => 'Notas';

  @override
  String get parentDashboardChildrenOverview => 'Visión general de hijos';

  @override
  String get parentDashboardNoChildrenConnected =>
      'Todavía no hay hijos conectados.\nVe a la pestaña Hijos para añadir uno.';

  @override
  String get parentDashboardRecentGrade => 'Nota reciente';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'No se pudieron cargar los datos de los hijos';

  @override
  String get childrenTitle => 'Hijos';

  @override
  String get childrenNoChildrenConnected => 'Sin hijos conectados';

  @override
  String get childrenShareQrHint =>
      'Comparte un código QR de invitación para conectar a un estudiante';

  @override
  String get childrenShowInviteQr => 'Mostrar QR de invitación';

  @override
  String get childrenInviteStudent => 'Invitar estudiante';

  @override
  String get childrenScanCodeHint =>
      'Pide al estudiante que escanee este código en su app';

  @override
  String get childrenFailedToCreateInvite => 'No se pudo crear la invitación';

  @override
  String get childrenRetry => 'Reintentar';

  @override
  String get childrenClose => 'Cerrar';

  @override
  String get childrenFailedToLoad => 'No se pudieron cargar los hijos';

  @override
  String get childDetailTitle => 'Detalle del hijo';

  @override
  String get childDetailCouldNotLoad => 'No se pudieron cargar los datos';

  @override
  String get childDetailNotFound => 'Hijo no encontrado';

  @override
  String get childDetailTermResults => 'Resultados trimestrales';

  @override
  String get childDetailNoTermResults =>
      'No hay resultados trimestrales guardados.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'No se pudieron cargar los resultados trimestrales';

  @override
  String get childDetailQuickGrades => 'Notas rápidas';

  @override
  String get childDetailNoQuickGrades => 'Todavía no hay notas rápidas';

  @override
  String get childDetailGrades => 'Notas';

  @override
  String get childDetailTotalPts => 'Puntos totales';

  @override
  String get childDetailPending => 'Pendiente';

  @override
  String get childDetailSettled => 'Liquidado';

  @override
  String get childDetailBonus => 'Bonificación';

  @override
  String get childDetailStatus => 'Estado';

  @override
  String get rewardsTitle => 'Recompensas';

  @override
  String get rewardsTabQuickGrades => 'Notas rápidas';

  @override
  String get rewardsTabSummary => 'Resumen';

  @override
  String get rewardsNoChildrenConnected => 'Sin hijos conectados';

  @override
  String get rewardsFailedToLoadData =>
      'No se pudieron cargar los datos de recompensas';

  @override
  String get rewardsRetry => 'Reintentar';

  @override
  String get rewardsNoPendingGrades => 'Sin notas pendientes';

  @override
  String get rewardsSettle => 'Liquidar';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Liquidar bonificación para $childName';
  }

  @override
  String get rewardsAmountToTransfer => 'Cantidad a transferir';

  @override
  String get rewardsCancel => 'Cancelar';

  @override
  String get rewardsConfirmSettle => 'Confirmar liquidación';

  @override
  String get rewardsSettled => '¡Liquidado!';

  @override
  String get parentInsightsTitle => 'Análisis';

  @override
  String get parentInsightsFailedToLoad => 'No se pudieron cargar los análisis';

  @override
  String get parentInsightsRetry => 'Reintentar';

  @override
  String get parentInsightsNoInsights => 'Todavía no hay análisis';

  @override
  String get parentInsightsNoInsightsHint =>
      'Conecta hijos para ver los análisis de sus notas';

  @override
  String get parentInsightsAllChildrenSummary => 'Todos los hijos — Resumen';

  @override
  String get parentInsightsTotalEarned => 'Total ganado';

  @override
  String get parentInsightsPending => 'Pendiente';

  @override
  String get parentInsightsChildren => 'Hijos';

  @override
  String get navHome => 'Inicio';

  @override
  String get navCalculator => 'Calculadora';

  @override
  String parentDashboardChildSubtitle(int count, int pts) {
    return '$count notas · $pts pts pendientes';
  }

  @override
  String get termDetailDeleteTitle => 'Eliminar resultado';

  @override
  String get termDetailDeleteConfirm =>
      '¿Estás seguro de que deseas eliminar este resultado? Esta acción no se puede deshacer.';

  @override
  String get termDetailDelete => 'Eliminar';

  @override
  String get termDetailEditLabel => 'Editar etiqueta';

  @override
  String get calculatorLabelHint => 'ej. Examen final';

  @override
  String studentNotesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count notas',
      one: '$count nota',
    );
    return '$_temp0';
  }

  @override
  String calculatorNoSubjectsMatch(String query) {
    return 'No hay asignaturas que coincidan con \"$query\"';
  }

  @override
  String get calculatorRemoveSubject => 'Eliminar';

  @override
  String calculatorFailedToSave(String error) {
    return 'Error al guardar: $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count asignaturas',
      one: '$count asignatura',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'ej. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count notas',
      one: '$count nota',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'Ver';

  @override
  String childrenPtsPending(int pts) {
    return '$pts pts pendientes';
  }

  @override
  String rewardsSummarySubtitle(int count, int pts) {
    return '$count notas · $pts pts total';
  }

  @override
  String get subjectFallback => 'Asignatura';

  @override
  String genericFailedError(String error) {
    return 'Error: $error';
  }

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Por favor espera $seconds segundos antes de solicitar otro código.';
  }

  @override
  String get cycleTypeDaily => 'Diario';

  @override
  String get cycleTypeWeekly => 'Semanal';

  @override
  String get cycleTypeMonthly => 'Mensual';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Neto: $pts pts';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Código: $code';
  }

  @override
  String get ptsAbbr => 'pts';

  @override
  String get bonusPtsLabel => 'pts bonus';

  @override
  String get totalGradesLabel => 'notas en total';

  @override
  String get classLabel => 'Clase';

  @override
  String get ratioLabel => 'proporción';

  @override
  String get genericRequestFailed => 'Solicitud fallida';

  @override
  String get parentFallback => 'Padre';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Fecha de nacimiento';

  @override
  String get registerDateOfBirthHint => 'Seleccionar fecha de nacimiento';

  @override
  String get registerDateOfBirthRequired =>
      'Por favor selecciona tu fecha de nacimiento';

  @override
  String get captureClassLevelLabel => 'Nivel de clase';
}
