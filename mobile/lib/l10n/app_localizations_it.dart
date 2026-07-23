// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class AppLocalizationsIt extends AppLocalizations {
  AppLocalizationsIt([String locale = 'it']) : super(locale);

  @override
  String get appName => 'Bonifatus';

  @override
  String get loginWelcomeBack => 'Bentornato';

  @override
  String get loginSignInSubtitle => 'Accedi al tuo account';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginEmailValidator => 'Inserisci un\'email valida';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginPasswordValidator => 'Inserisci la tua password';

  @override
  String get loginForgotPassword => 'Hai dimenticato la password?';

  @override
  String get loginSignInButton => 'Accedi';

  @override
  String get loginBiometricButton => 'Accedi con la biometria';

  @override
  String get loginNoAccountPrompt => 'Non hai un account? ';

  @override
  String get loginSignUpLink => 'Registrati';

  @override
  String get registerStep1Title => 'Come ti chiami?';

  @override
  String get registerStep1Subtitle => 'Così apparirai agli altri.';

  @override
  String get registerFullNameLabel => 'Nome completo';

  @override
  String get registerContinueButton => 'Continua';

  @override
  String get registerStep2Title => 'Sono...';

  @override
  String get registerStep2Subtitle =>
      'Scegli il tuo ruolo per l\'esperienza giusta.';

  @override
  String get registerRoleStudentTitle => 'Studente';

  @override
  String get registerRoleStudentSubtitle =>
      'Traccia i miei voti e guadagna premi';

  @override
  String get registerRoleParentTitle => 'Genitore';

  @override
  String get registerRoleParentSubtitle =>
      'Imposta premi e monitora i progressi del figlio';

  @override
  String get registerStep3Title => 'Crea il tuo account';

  @override
  String get registerStep3Subtitle => 'Ci siamo quasi!';

  @override
  String get registerEmailLabel => 'Email';

  @override
  String get registerPasswordLabel => 'Password';

  @override
  String get registerConfirmPasswordLabel => 'Conferma password';

  @override
  String get registerCreateAccountButton => 'Crea account';

  @override
  String get registerAlreadyHaveAccount => 'Hai già un account? ';

  @override
  String get registerSignInLink => 'Accedi';

  @override
  String get registerPasswordsDoNotMatch => 'Le password non corrispondono';

  @override
  String get registerPasswordTooShort =>
      'La password deve avere almeno 12 caratteri';

  @override
  String get registerFailed => 'Registrazione fallita. Riprova.';

  @override
  String get forgotPasswordAppBarTitle => 'Reimposta password';

  @override
  String get forgotPasswordStep1Title => 'Hai dimenticato la password?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Inserisci la tua email e ti invieremo un codice di reimpostazione.';

  @override
  String get forgotPasswordEmailLabel => 'Email';

  @override
  String get forgotPasswordSendCodeButton => 'Invia codice';

  @override
  String get forgotPasswordStep2Title => 'Controlla la tua email';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Inserisci il codice che abbiamo inviato a $email.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Codice di reimpostazione';

  @override
  String get forgotPasswordNewPasswordLabel => 'Nuova password';

  @override
  String get forgotPasswordResetButton => 'Reimposta password';

  @override
  String get forgotPasswordResendCode => 'Invia di nuovo il codice';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Password aggiornata! Accedi con la tua nuova password.';

  @override
  String get verifyEmailAppBarTitle => 'Verifica email';

  @override
  String get verifyEmailTitle => 'Controlla la tua email';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Inserisci il codice a 6 cifre inviato a\n$email';
  }

  @override
  String get verifyEmailButton => 'Verifica';

  @override
  String get verifyEmailFailed => 'Verifica fallita. Riprova.';

  @override
  String get onboardingSkip => 'Salta';

  @override
  String get onboardingNext => 'Avanti';

  @override
  String get onboardingGetStarted => 'Inizia';

  @override
  String get onboardingNoAccountPrompt => 'Non hai un account? ';

  @override
  String get onboardingSignUpLink => 'Registrati';

  @override
  String get onboardingPage1Title => 'Trasforma i voti\nin premi';

  @override
  String get onboardingPage1Body =>
      'Gli studenti guadagnano punti bonus per ogni buon voto. I genitori impostano i premi. Tutti vincono.';

  @override
  String get onboardingPage2Title => 'Fotografa un voto,\nguadagna subito';

  @override
  String get onboardingPage2Body =>
      'Fotografa qualsiasi lavoro scolastico valutato. L\'app legge la materia e il voto automaticamente.';

  @override
  String get onboardingPage3Title => 'Segui i progressi\ninsieme';

  @override
  String get onboardingPage3Body =>
      'Genitori e studenti vedono le stesse informazioni — voti, bonus e tendenze nel tempo.';

  @override
  String get settingsTitle => 'Impostazioni';

  @override
  String get settingsSectionPreferences => 'Preferenze';

  @override
  String get settingsSectionAccount => 'Account';

  @override
  String get settingsSectionConnectedParents => 'Genitori connessi';

  @override
  String get settingsSectionApp => 'App';

  @override
  String get settingsAppearanceLabel => 'Aspetto';

  @override
  String get settingsThemeSystem => 'Sistema';

  @override
  String get settingsThemeLight => 'Chiaro';

  @override
  String get settingsThemeDark => 'Scuro';

  @override
  String get settingsLanguageLabel => 'Lingua';

  @override
  String get settingsLanguageAuto => 'Auto';

  @override
  String get settingsLanguageAutoSystem => 'Auto (Sistema)';

  @override
  String get settingsEditProfile => 'Modifica profilo';

  @override
  String get settingsChangePassword => 'Cambia password';

  @override
  String get settingsChangeEmail => 'Cambia email';

  @override
  String get settingsBiometricLogin => 'Accesso biometrico';

  @override
  String get settingsBiometricVerifyFailed =>
      'Verifica biometrica non riuscita. Riprova.';

  @override
  String get settingsDeleteAccount => 'Elimina account';

  @override
  String get settingsDeleteAccountDialogTitle => 'Elimina account';

  @override
  String get settingsDeleteAccountDialogContent =>
      'Questo eliminerà definitivamente il tuo account e tutti i dati. Questa azione non può essere annullata.';

  @override
  String get settingsDeleteAccountConfirm => 'Elimina account';

  @override
  String get settingsCancel => 'Annulla';

  @override
  String get settingsAbout => 'Informazioni';

  @override
  String get settingsLogOut => 'Esci';

  @override
  String get settingsNoParentsConnected => 'Nessun genitore connesso';

  @override
  String get settingsScanQr => 'Scansiona QR';

  @override
  String get settingsAddAnotherParent => 'Aggiungi un altro genitore';

  @override
  String get settingsScanParentQrTitle => 'Scansiona QR del genitore';

  @override
  String get settingsScanQrInstructions =>
      'Punta la fotocamera sul codice QR mostrato sul dispositivo del genitore';

  @override
  String settingsConnectedSince(String date) {
    return 'Connesso il $date';
  }

  @override
  String get settingsRemoveConnection => 'Rimuovi connessione';

  @override
  String get settingsRemoveConnectionTitle => 'Rimuovi connessione';

  @override
  String get settingsRemoveConnectionContent =>
      'Sei sicuro di voler rimuovere questa connessione genitoriale? Questa azione non può essere annullata.';

  @override
  String get settingsRemoveConnectionSuccess => 'Connessione rimossa';

  @override
  String get settingsRemoveConnectionFailed =>
      'Impossibile rimuovere la connessione';

  @override
  String get settingsParentConnected => 'Genitore connesso!';

  @override
  String get settingsEditProfileTitle => 'Modifica profilo';

  @override
  String get settingsFullName => 'Nome completo';

  @override
  String get settingsNameCannotBeEmpty => 'Il nome non può essere vuoto';

  @override
  String get settingsProfileUpdated => 'Profilo aggiornato';

  @override
  String get settingsChangePasswordTitle => 'Cambia password';

  @override
  String get settingsCurrentPassword => 'Password attuale';

  @override
  String get settingsEnterCurrentPassword => 'Inserisci la password attuale';

  @override
  String get settingsNewPassword => 'Nuova password';

  @override
  String get settingsConfirmPassword => 'Conferma password';

  @override
  String get settingsEnterPassword => 'Inserisci una password';

  @override
  String get settingsMin12Chars => 'Minimo 12 caratteri';

  @override
  String get settingsPasswordsDoNotMatch => 'Le password non corrispondono';

  @override
  String get settingsPasswordChanged => 'Password cambiata';

  @override
  String get settingsChangeEmailTitle => 'Cambia email';

  @override
  String get settingsNewEmailAddress => 'Nuovo indirizzo email';

  @override
  String get settingsEnterEmail => 'Inserisci un\'email';

  @override
  String get settingsEnterValidEmail => 'Inserisci un\'email valida';

  @override
  String get settingsSendVerificationCode => 'Invia codice di verifica';

  @override
  String get settingsSending => 'Invio in corso…';

  @override
  String settingsCodeSentTo(String email) {
    return 'Abbiamo inviato un codice a 6 cifre a $email.';
  }

  @override
  String get settingsVerificationCode => 'Codice di verifica';

  @override
  String get settingsEnter6DigitCode => 'Inserisci il codice a 6 cifre';

  @override
  String get settingsEmailUpdated => 'Email aggiornata';

  @override
  String get settingsInvalidCode => 'Codice non valido o scaduto. Riprova.';

  @override
  String get settingsSave => 'Salva';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Eliminazione account fallita: $error';
  }

  @override
  String get settingsAboutLegalese => 'Tracker di premi voti per studenti';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Configurazione voti';

  @override
  String get settingsGradingConfigSubtitle =>
      'Moltiplicatori tier · ciclo note · rapporto bonus';

  @override
  String get settingsGradeTierMultipliers => 'Moltiplicatori livello voto';

  @override
  String get settingsOngoingNotesCycle => 'Ciclo note in corso';

  @override
  String settingsEditMultiplier(String label) {
    return 'Modifica moltiplicatore: $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Configurazione per $childName';
  }

  @override
  String get settingsCycleType => 'Tipo di ciclo';

  @override
  String get settingsBonusRatio => 'Rapporto bonus';

  @override
  String get settingsTierBestLabel => 'Ottimo (Voto 1–2)';

  @override
  String get settingsTierSecondLabel => 'Buono (Voto 3)';

  @override
  String get settingsTierThirdLabel => 'Sufficiente (Voto 4)';

  @override
  String get settingsFailedToLoadChildren => 'Impossibile caricare i bambini';

  @override
  String get settingsNoChildrenConnected => 'Nessun bambino connesso';

  @override
  String dashboardHiName(String name) {
    return 'Ciao $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Tieni traccia dei tuoi voti, guadagna premi';

  @override
  String get dashboardThisWeek => 'Questa settimana';

  @override
  String get dashboardRecentNotes => 'Note recenti';

  @override
  String get dashboardSavedResults => 'Risultati salvati';

  @override
  String get dashboardQuickCalculate => 'Calcolo rapido';

  @override
  String get dashboardCouldNotLoadNotes => 'Impossibile caricare le note';

  @override
  String get dashboardNoNotesYet => 'Nessuna nota ancora';

  @override
  String get dashboardCouldNotLoadResults => 'Impossibile caricare i risultati';

  @override
  String get dashboardNoSavedResultsYet => 'Nessun risultato salvato ancora';

  @override
  String get calculatorTitle => 'Calcolatore voti';

  @override
  String get calculatorGradingSystem => 'Sistema di valutazione';

  @override
  String get calculatorClass => 'Classe';

  @override
  String get calculatorTerm => 'Semestre';

  @override
  String get calculatorSchoolYear => 'Anno scolastico';

  @override
  String get calculatorLabelOptional => 'Etichetta (opzionale)';

  @override
  String get calculatorGradePlanner => 'Pianificatore voti';

  @override
  String get calculatorGradePlannerHint =>
      'Imposta classe e semestre in alto, poi tocca \"Aggiungi materia\".';

  @override
  String get calculatorAddSubject => 'Aggiungi materia';

  @override
  String get calculatorSearchSubjects => 'Cerca materie…';

  @override
  String get calculatorGradeLabel => 'Voto';

  @override
  String get calculatorWeightLabel => 'Peso';

  @override
  String get calculatorWeightTooltip =>
      'Peso maggiore = più bonus. Usa 2× per esami difficili.';

  @override
  String get calculatorSelectSubjectValidator => 'Seleziona una materia';

  @override
  String get calculatorSelectGradeValidator => 'Seleziona un voto';

  @override
  String get calculatorCoreSubjects => 'Materie principali';

  @override
  String get calculatorOther => 'Altre';

  @override
  String get calculatorTotalBonus => 'Bonus totale';

  @override
  String get calculatorSaveResult => 'Salva risultato';

  @override
  String get calculatorResultSaved => 'Risultato salvato!';

  @override
  String get calculatorSaveChanges => 'Salva modifiche';

  @override
  String get calculatorTierExcellent => 'Eccellente';

  @override
  String get calculatorTierGood => 'Buono';

  @override
  String get calculatorTierSatisfactory => 'Sufficiente';

  @override
  String get calculatorTierBelow => 'Sotto la soglia';

  @override
  String get calculatorSettingsTooltip => 'Impostazioni';

  @override
  String get notesTitle => 'Note';

  @override
  String get notesNoNotesYet => 'Nessuna nota ancora';

  @override
  String get notesTapToCaptureFirst =>
      'Tocca + per catturare il tuo primo voto';

  @override
  String get notesFailedToLoad => 'Impossibile caricare le note';

  @override
  String get genericRetry => 'Riprova';

  @override
  String get notesRetry => 'Riprova';

  @override
  String get notesViewCycleSummary => 'Visualizza riepilogo ciclo';

  @override
  String get notesDeleteGradeTitle => 'Elimina voto';

  @override
  String get notesDeleteGradeConfirm =>
      'Sei sicuro di voler eliminare questo voto?';

  @override
  String get notesDelete => 'Elimina';

  @override
  String get notesCancel => 'Annulla';

  @override
  String get notesThisWeek => 'Questa settimana';

  @override
  String get notesLastWeek => 'La settimana scorsa';

  @override
  String get noteDetailTitle => 'Dettaglio nota';

  @override
  String get noteDetailCouldNotLoad => 'Impossibile caricare la nota';

  @override
  String get noteDetailNotFound => 'Voto non trovato';

  @override
  String get noteDetailDateCaptured => 'Data acquisizione';

  @override
  String get noteDetailQualityTier => 'Livello qualità';

  @override
  String get noteDetailSettlement => 'Liquidazione';

  @override
  String get noteDetailSettled => 'Liquidato';

  @override
  String get noteDetailPending => 'In sospeso';

  @override
  String get noteDetailTier1 => 'Livello 1 — Eccellente';

  @override
  String get noteDetailTier2 => 'Livello 2 — Buono';

  @override
  String get noteDetailTier3 => 'Livello 3 — Sufficiente';

  @override
  String get noteDetailTierBelow => 'Sotto la soglia';

  @override
  String get noteDetailDeleteTitle => 'Elimina nota';

  @override
  String get noteDetailDeleteConfirm =>
      'Sei sicuro di voler eliminare questa nota? Questa azione non può essere annullata.';

  @override
  String get noteDetailDelete => 'Elimina';

  @override
  String get noteDetailCancel => 'Annulla';

  @override
  String get captureTitle => 'Cattura voto';

  @override
  String get capturePositionGrade =>
      'Posiziona il voto in modo che sia chiaramente visibile';

  @override
  String get captureChooseFromGallery => 'Scegli dalla galleria';

  @override
  String get captureTakePhoto => 'Scatta foto';

  @override
  String get captureLoadingEntry => 'Caricamento inserimento voto...';

  @override
  String get captureEnterGrade => 'Inserisci voto';

  @override
  String get captureSelectSubjectGrade =>
      'Seleziona la materia e il valore del voto';

  @override
  String get captureSubjectLabel => 'Materia';

  @override
  String get captureGradeLabel => 'Voto';

  @override
  String get captureNoSubjectsLoaded => 'Nessuna materia caricata';

  @override
  String get captureSelectSubjectAndGrade => 'Seleziona una materia e un voto';

  @override
  String get captureSaveGrade => 'Salva voto';

  @override
  String get captureCancel => 'Annulla';

  @override
  String get cycleSummaryTitle => 'Riepilogo ciclo';

  @override
  String get cycleSummaryCouldNotLoad => 'Impossibile caricare i voti';

  @override
  String get cycleSummaryWeekly => 'Settimanale';

  @override
  String get cycleSummaryNotesInCycle => 'Note in questo ciclo';

  @override
  String get cycleSummaryNoGrades => 'Nessun voto in questo periodo';

  @override
  String get cycleSummaryPositive => 'Positivo';

  @override
  String get cycleSummaryNet => 'Netto';

  @override
  String get resultsTitle => 'Risultati salvati';

  @override
  String get resultsFailedToLoad => 'Impossibile caricare i risultati';

  @override
  String get resultsRetry => 'Riprova';

  @override
  String get resultsNoResults => 'Nessun risultato salvato ancora';

  @override
  String get resultsUseCalculator =>
      'Usa il calcolatore per salvare il tuo primo risultato semestrale.';

  @override
  String get resultsOpenCalculator => 'Apri calcolatore';

  @override
  String get termDetailTitle => 'Risultato semestrale';

  @override
  String get termDetailCouldNotLoad => 'Impossibile caricare il semestre';

  @override
  String get termDetailNotFound => 'Semestre non trovato';

  @override
  String get termDetailAverage => 'Media';

  @override
  String get termDetailBonus => 'Bonus';

  @override
  String get termDetailSubjects => 'Materie';

  @override
  String get termDetailSubjectBreakdown => 'Dettaglio materie';

  @override
  String get insightsTitle => 'Analisi';

  @override
  String get insightsFailedToLoad => 'Impossibile caricare le analisi';

  @override
  String get insightsRetry => 'Riprova';

  @override
  String get insightsNoGradesYet => 'Nessun voto ancora';

  @override
  String get insightsAddGradesHint =>
      'Aggiungi voti nella scheda Note per vedere le analisi.';

  @override
  String get insightsBonusPointsLastMonths => 'Punti bonus — Ultimi 6 mesi';

  @override
  String get insightsNoBonusPoints => 'Nessun punto bonus negli ultimi 6 mesi';

  @override
  String get insightsGradeDistribution => 'Distribuzione voti';

  @override
  String get insightsThisWeek => 'Questa settimana';

  @override
  String get insightsAllTime => 'Tutto il tempo';

  @override
  String get insightsGrades => 'Voti';

  @override
  String get insightsEarned => 'Guadagnati';

  @override
  String get insightsUnsettled => 'Non liquidati';

  @override
  String get insightsTotalPts => 'Punti totali';

  @override
  String get insightsPending => 'In sospeso';

  @override
  String get periodWeek => 'Settimana';

  @override
  String get periodMonth => 'Mese';

  @override
  String get periodAllTime => 'Totale';

  @override
  String get insightsTierBest => 'Eccellente (1–1,4)';

  @override
  String get insightsTierGood => 'Buono (1,5–2,4)';

  @override
  String get insightsTierOk => 'Sufficiente (2,5–3,4)';

  @override
  String get insightsTierBelow => 'Insufficiente (3,5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Ciao $name';
  }

  @override
  String get parentDashboardOverview => 'Panoramica dei tuoi figli';

  @override
  String get parentDashboardSummary => 'Riepilogo';

  @override
  String get parentDashboardChildren => 'Figli';

  @override
  String get parentDashboardPending => 'In sospeso';

  @override
  String get parentDashboardGrades => 'Voti';

  @override
  String get parentDashboardChildrenOverview => 'Panoramica figli';

  @override
  String get parentDashboardNoChildrenConnected =>
      'Nessun figlio connesso ancora.\nVai alla scheda Figli per aggiungerne uno.';

  @override
  String get parentDashboardRecentGrade => 'Voto recente';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'Impossibile caricare i dati dei figli';

  @override
  String get childrenTitle => 'Figli';

  @override
  String get childrenNoChildrenConnected => 'Nessun figlio connesso';

  @override
  String get childrenShareQrHint =>
      'Condividi un QR code di invito per connettere uno studente';

  @override
  String get childrenShowInviteQr => 'Mostra QR di invito';

  @override
  String get childrenInviteStudent => 'Invita uno studente';

  @override
  String get childrenScanCodeHint =>
      'Chiedi allo studente di scansionare questo codice nella sua app';

  @override
  String get childrenFailedToCreateInvite => 'Impossibile creare l\'invito';

  @override
  String get childrenRetry => 'Riprova';

  @override
  String get childrenClose => 'Chiudi';

  @override
  String get childrenFailedToLoad => 'Impossibile caricare i figli';

  @override
  String get childDetailTitle => 'Dettaglio figlio';

  @override
  String get childDetailCouldNotLoad => 'Impossibile caricare i dati';

  @override
  String get childDetailNotFound => 'Figlio non trovato';

  @override
  String get childDetailTermResults => 'Risultati semestrali';

  @override
  String get childDetailNoTermResults => 'Nessun risultato semestrale salvato.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'Impossibile caricare i risultati semestrali';

  @override
  String get childDetailQuickGrades => 'Risultati dei test';

  @override
  String get childDetailNoQuickGrades => 'Nessun risultato di test ancora';

  @override
  String get childDetailGrades => 'Voti';

  @override
  String get childDetailTotalPts => 'Punti totali';

  @override
  String get childDetailPending => 'In sospeso';

  @override
  String get childDetailSettled => 'Liquidato';

  @override
  String get childDetailBonus => 'Bonus';

  @override
  String get childDetailStatus => 'Stato';

  @override
  String get rewardsTitle => 'Premi';

  @override
  String get rewardsTabQuickGrades => 'Voti rapidi';

  @override
  String get rewardsTabGrades => 'Voti';

  @override
  String get rewardsTabSummary => 'Riepilogo';

  @override
  String get rewardsTabHistory => 'Cronologia';

  @override
  String get rewardsHistoryEmpty => 'Nessun pagamento ancora';

  @override
  String get rewardsBadgeTerm => 'Periodo';

  @override
  String get rewardsNoChildrenConnected => 'Nessun figlio connesso';

  @override
  String get rewardsFailedToLoadData => 'Impossibile caricare i dati premi';

  @override
  String get rewardsRetry => 'Riprova';

  @override
  String get rewardsNoPendingGrades => 'Nessun voto in sospeso';

  @override
  String get rewardsSettle => 'Liquida';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Liquida bonus per $childName';
  }

  @override
  String get rewardsAmountToTransfer => 'Importo da trasferire';

  @override
  String get rewardsCancel => 'Annulla';

  @override
  String get rewardsConfirmSettle => 'Conferma liquidazione';

  @override
  String get rewardsSettled => 'Liquidato!';

  @override
  String get rewardsSectionTermGrades => 'Voti trimestrali';

  @override
  String rewardsSectionNotesWeek(String weekRange) {
    return 'Note — $weekRange';
  }

  @override
  String rewardsGroupSettleBonusFor(String label, String childName) {
    return 'Liquida $label per $childName';
  }

  @override
  String get childrenSearchPlaceholder => 'Cerca bambini...';

  @override
  String get insightsFilterAll => 'Tutti';

  @override
  String get parentInsightsTitle => 'Analisi';

  @override
  String get parentInsightsFailedToLoad => 'Impossibile caricare le analisi';

  @override
  String get parentInsightsRetry => 'Riprova';

  @override
  String get parentInsightsNoInsights => 'Nessuna analisi ancora';

  @override
  String get parentInsightsNoInsightsHint =>
      'Connetti figli per vedere le analisi dei loro voti';

  @override
  String get parentInsightsAllChildrenSummary => 'Tutti i figli — Riepilogo';

  @override
  String get parentInsightsTotalEarned => 'Totale guadagnato';

  @override
  String get parentInsightsPending => 'In sospeso';

  @override
  String get parentInsightsChildren => 'Figli';

  @override
  String get insightsReadyToSettle => 'Da liquidare';

  @override
  String get insightsRecentActivity => 'Attività recente';

  @override
  String get insightsPendingPts => 'Pts in sospeso';

  @override
  String get insightsUnsettledGrades => 'In sospeso';

  @override
  String get insightsToday => 'Oggi';

  @override
  String get insightsYesterday => 'Ieri';

  @override
  String insightsDaysAgo(int days) {
    return '${days}g fa';
  }

  @override
  String get insightsNote => 'nota';

  @override
  String get insightsNotes => 'note';

  @override
  String rewardsSettleAmount(num pts) {
    return 'Liquida · $pts pts';
  }

  @override
  String get navHome => 'Home';

  @override
  String get navCalculator => 'Calcolatrice';

  @override
  String parentDashboardChildSubtitle(int count, num pts) {
    return '$count voti · $pts pts in sospeso';
  }

  @override
  String get homeActionCenterSubtitle => 'Ecco cosa richiede la tua attenzione';

  @override
  String homeUnsettledBannerTitle(num pts) {
    return '$pts pts pronti per il saldo';
  }

  @override
  String homeUnsettledBannerSub(int count) {
    return '$count elementi in sospeso';
  }

  @override
  String get homeGoToInsights => 'Vai alle Analisi';

  @override
  String get homeTopPendingSection => 'Elemento in sospeso più alto';

  @override
  String get homeActiveTodaySection => 'Attivi oggi';

  @override
  String get homeActiveTodayEmpty => 'Nessuna attività nelle ultime 24 ore';

  @override
  String get homeAllSettledUp => 'Tutto saldato!';

  @override
  String get termDetailDeleteTitle => 'Elimina risultato';

  @override
  String get termDetailDeleteConfirm =>
      'Sei sicuro di voler eliminare questo risultato? Questa azione non può essere annullata.';

  @override
  String get termDetailDelete => 'Elimina';

  @override
  String get termDetailEditLabel => 'Modifica etichetta';

  @override
  String get termDetailEditGrade => 'Modifica voto';

  @override
  String get termSettledBadge => 'Saldato';

  @override
  String get termOpenBadge => 'Aperto';

  @override
  String get calculatorLabelHint => 'es. Esame finale';

  @override
  String studentNotesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count note',
      one: '$count nota',
    );
    return '$_temp0';
  }

  @override
  String calculatorNoSubjectsMatch(String query) {
    return 'Nessuna materia corrisponde a \"$query\"';
  }

  @override
  String get calculatorRemoveSubject => 'Rimuovi';

  @override
  String calculatorFailedToSave(String error) {
    return 'Salvataggio fallito: $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count materie',
      one: '$count materia',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'es. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count voti',
      one: '$count voto',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'Visualizza';

  @override
  String childrenPtsPending(num pts) {
    return '$pts pts in sospeso';
  }

  @override
  String rewardsSummarySubtitle(int count, num pts) {
    return '$count voti · $pts pts totali';
  }

  @override
  String get subjectFallback => 'Materia';

  @override
  String genericFailedError(String error) {
    return 'Errore: $error';
  }

  @override
  String get errorLoadingConfig => 'Impossibile caricare la configurazione';

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Attendere $seconds secondi prima di richiedere un altro codice.';
  }

  @override
  String get cycleTypeDaily => 'Giornaliero';

  @override
  String get cycleTypeWeekly => 'Settimanale';

  @override
  String get cycleTypeMonthly => 'Mensile';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Netto: $pts pts';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Codice: $code';
  }

  @override
  String get ptsAbbr => 'pts';

  @override
  String get bonusPtsLabel => 'pts bonus';

  @override
  String get totalGradesLabel => 'voti totali';

  @override
  String get classLabel => 'Classe';

  @override
  String get ratioLabel => 'rapporto';

  @override
  String get genericRequestFailed => 'Richiesta fallita';

  @override
  String get parentFallback => 'Genitore';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Data di nascita';

  @override
  String get registerDateOfBirthHint => 'Seleziona data di nascita';

  @override
  String get registerDateOfBirthRequired => 'Seleziona la tua data di nascita';

  @override
  String get captureClassLevelLabel => 'Livello classe';

  @override
  String get captureAnalyzingImage => 'Analisi immagine…';

  @override
  String get captureDetectedHint => 'Voto rilevato — controlla e conferma';

  @override
  String get captureReviewGrades => 'Rivedi i voti rilevati';

  @override
  String captureNGradesDetected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count voti rilevati',
      one: '1 voto rilevato',
      zero: 'Nessun voto rilevato',
    );
    return '$_temp0';
  }

  @override
  String get captureAddEntry => 'Aggiungi voce';

  @override
  String captureSaveAll(int count) {
    return 'Salva $count';
  }

  @override
  String get captureSelectSubject => 'Tocca per selezionare';

  @override
  String get termTypeSemester1 => 'Semestre 1';

  @override
  String get termTypeSemester2 => 'Semestre 2';

  @override
  String get termTypeTrimester1 => 'Trimestre 1';

  @override
  String get termTypeTrimester2 => 'Trimestre 2';

  @override
  String get termTypeTrimester3 => 'Trimestre 3';

  @override
  String get termTypeAnnual => 'Annuale';

  @override
  String get nameUnknown => 'Sconosciuto';

  @override
  String get gradingSystemGermanDefault => 'Tedesco 1–6';

  @override
  String get loginOrDivider => 'o';

  @override
  String get loginContinueWithGoogle => 'Continua con Google';

  @override
  String get googleProfileTitle => 'Completa il tuo profilo';

  @override
  String get googleProfileSubtitle =>
      'Solo ancora qualche dettaglio per iniziare.';

  @override
  String get googleProfileRoleRequired => 'Per favore seleziona il tuo ruolo';

  @override
  String get registerPasswordHelper => 'Minimo 12 caratteri';

  @override
  String get aboutDescription =>
      'Bonifatus trasforma i voti scolastici in premi di famiglia. Gli studenti guadagnano punti bonus per i buoni voti, i genitori stabiliscono i premi.';

  @override
  String get aboutPrivacyPolicy => 'Informativa sulla Privacy';

  @override
  String get aboutTermsOfService => 'Termini di Servizio';

  @override
  String get settingsSectionConnectedChildren => 'Figli connessi';

  @override
  String get settingsChildBirthday => 'Data di nascita';

  @override
  String get settingsChildSchool => 'Scuola';

  @override
  String get settingsChildNotSpecified => 'Non specificato';

  @override
  String settingsChildStats(int grades, num pts, num pending) {
    return '$grades voti · $pts pts totali · $pending in sospeso';
  }

  @override
  String get settleTitle => 'Regolare';

  @override
  String get settleTabPending => 'In sospeso';

  @override
  String get settleTabHistory => 'Cronologia';

  @override
  String get settleNoPackages => 'Nessun pacchetto da regolare';

  @override
  String get settleLoadError => 'Impossibile caricare i pacchetti';

  @override
  String get settleRetry => 'Riprova';

  @override
  String get settleFilterAll => 'Tutti';

  @override
  String get settleFilterReportCards => 'Pagelle';

  @override
  String get settleFilterPeriods => 'Periodi di voti';

  @override
  String get settleReportCardBadge => 'Pagella';

  @override
  String get settleGradePeriodBadge => 'Periodo voti';

  @override
  String get settleOngoingBadge => 'In corso';

  @override
  String settlePackageItems(int count) {
    return '$count voci';
  }

  @override
  String get settlePackageButton => 'Regola pacchetto';

  @override
  String get settleConfirmTitle => 'Conferma regolazione';

  @override
  String settleConfirmBody(num pts, String childName) {
    return 'Trasferisci $pts pts a $childName';
  }

  @override
  String get settleConfirmButton => 'Conferma';

  @override
  String get settleSuccess => 'Pacchetto regolato!';

  @override
  String get settlePeriodLabel => 'Raggruppamento periodi voti';

  @override
  String get settlePeriodWeekly => 'Settimanale';

  @override
  String get settlePeriodMonthly => 'Mensile';

  @override
  String get settlePeriodQuarterly => 'Trimestrale';

  @override
  String settleSchoolYear(String year) {
    return 'Anno scolastico $year';
  }

  @override
  String settleClassLevel(int level) {
    return 'Classe $level';
  }

  @override
  String get termDetailEditFull => 'Modifica rapporto';

  @override
  String get insightsGradeTrend => 'Andamento voti';

  @override
  String get insightsGradeTrendSubtitle => 'Medie per periodo';

  @override
  String get insightsNoTermResults => 'Nessun risultato dal calcolatore';

  @override
  String get insightsSubjectRankings => 'Classifica materie';

  @override
  String get insightsBestSubject => 'Materia migliore';

  @override
  String get insightsWorstSubject => 'Da migliorare';

  @override
  String get insightsStreak => 'Serie attiva';

  @override
  String insightsStreakWeeks(int count) {
    return '${count}s';
  }

  @override
  String get insightsBestGrade => 'Voto migliore';

  @override
  String get insightsWorstGrade => 'Voto più basso';

  @override
  String get insightsNoStreak => 'Inizia la tua serie!';

  @override
  String homeChildPts(num pts) {
    return '$pts pts';
  }

  @override
  String homeChildGrades(int count) {
    return '$count voto/i';
  }

  @override
  String get settingsSectionSchool => 'Informazioni scolastiche';

  @override
  String get settingsSchoolInfo => 'Scuola e sistema di valutazione';

  @override
  String get settingsSchoolInfoDesc =>
      'Configura i dati scolastici per calcoli bonus accurati';

  @override
  String get profileSchoolTown => 'Citta della scuola';

  @override
  String get profileSchoolTownPlaceholder => 'es. Monaco';

  @override
  String get profileSchoolName => 'Nome della scuola';

  @override
  String get profileSchoolNamePlaceholder => 'es. Maximilians-Gymnasium';

  @override
  String get profileSemesterSystem => 'Sistema semestrale';

  @override
  String get profileSemesterCount2 => '2 semestri per anno';

  @override
  String get profileSemesterCount3 => '3 trimestri per anno';

  @override
  String get profileSemesterCount4 => '4 trimestri per anno';

  @override
  String get profileProgramLength => 'Durata del programma scolastico';

  @override
  String get profileProgramLengthYears => 'anni';

  @override
  String get profileProgramLengthDefault => 'standard';

  @override
  String get profileProgramLengthHint =>
      'Per calcolare equamente i punti bonus tra diversi programmi scolastici';

  @override
  String get profileSaved => 'Profilo salvato';

  @override
  String get insightsPeriodMonth => '1 Mese';

  @override
  String get insightsPeriod3Months => '3 Mesi';

  @override
  String get insightsPeriodYear => '1 Anno';

  @override
  String get insightsPeriodAll => 'Sempre';
}
