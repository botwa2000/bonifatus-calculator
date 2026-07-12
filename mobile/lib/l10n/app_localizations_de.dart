// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get loginWelcomeBack => 'Willkommen zurück';

  @override
  String get loginSignInSubtitle => 'In dein Konto einloggen';

  @override
  String get loginEmailLabel => 'E-Mail';

  @override
  String get loginEmailValidator => 'Gib eine gültige E-Mail-Adresse ein';

  @override
  String get loginPasswordLabel => 'Passwort';

  @override
  String get loginPasswordValidator => 'Gib dein Passwort ein';

  @override
  String get loginForgotPassword => 'Passwort vergessen?';

  @override
  String get loginSignInButton => 'Anmelden';

  @override
  String get loginBiometricButton => 'Mit Biometrie anmelden';

  @override
  String get loginNoAccountPrompt => 'Noch kein Konto? ';

  @override
  String get loginSignUpLink => 'Registrieren';

  @override
  String get registerStep1Title => 'Wie heißt du?';

  @override
  String get registerStep1Subtitle => 'So wirst du anderen angezeigt.';

  @override
  String get registerFullNameLabel => 'Vollständiger Name';

  @override
  String get registerContinueButton => 'Weiter';

  @override
  String get registerStep2Title => 'Ich bin...';

  @override
  String get registerStep2Subtitle =>
      'Wähle deine Rolle für das richtige Erlebnis.';

  @override
  String get registerRoleStudentTitle => 'Schüler';

  @override
  String get registerRoleStudentSubtitle =>
      'Meine Noten verfolgen und Belohnungen verdienen';

  @override
  String get registerRoleParentTitle => 'Elternteil';

  @override
  String get registerRoleParentSubtitle =>
      'Belohnungen setzen und Fortschritt des Kindes beobachten';

  @override
  String get registerStep3Title => 'Konto erstellen';

  @override
  String get registerStep3Subtitle => 'Fast geschafft!';

  @override
  String get registerEmailLabel => 'E-Mail';

  @override
  String get registerPasswordLabel => 'Passwort';

  @override
  String get registerConfirmPasswordLabel => 'Passwort bestätigen';

  @override
  String get registerCreateAccountButton => 'Konto erstellen';

  @override
  String get registerAlreadyHaveAccount => 'Bereits ein Konto? ';

  @override
  String get registerSignInLink => 'Anmelden';

  @override
  String get registerPasswordsDoNotMatch => 'Passwörter stimmen nicht überein';

  @override
  String get registerPasswordTooShort =>
      'Passwort muss mindestens 12 Zeichen haben';

  @override
  String get registerFailed =>
      'Registrierung fehlgeschlagen. Bitte erneut versuchen.';

  @override
  String get forgotPasswordAppBarTitle => 'Passwort zurücksetzen';

  @override
  String get forgotPasswordStep1Title => 'Passwort vergessen?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Gib deine E-Mail ein und wir schicken dir einen Reset-Code.';

  @override
  String get forgotPasswordEmailLabel => 'E-Mail';

  @override
  String get forgotPasswordSendCodeButton => 'Reset-Code senden';

  @override
  String get forgotPasswordStep2Title => 'Prüfe deine E-Mails';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Gib den Code ein, den wir an $email gesendet haben.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Reset-Code';

  @override
  String get forgotPasswordNewPasswordLabel => 'Neues Passwort';

  @override
  String get forgotPasswordResetButton => 'Passwort zurücksetzen';

  @override
  String get forgotPasswordResendCode => 'Code erneut senden';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Passwort aktualisiert! Melde dich mit deinem neuen Passwort an.';

  @override
  String get verifyEmailAppBarTitle => 'E-Mail bestätigen';

  @override
  String get verifyEmailTitle => 'Prüfe deine E-Mails';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Gib den 6-stelligen Code ein, der an\n$email gesendet wurde';
  }

  @override
  String get verifyEmailButton => 'Bestätigen';

  @override
  String get verifyEmailFailed =>
      'Bestätigung fehlgeschlagen. Bitte erneut versuchen.';

  @override
  String get onboardingSkip => 'Überspringen';

  @override
  String get onboardingNext => 'Weiter';

  @override
  String get onboardingGetStarted => 'Loslegen';

  @override
  String get onboardingNoAccountPrompt => 'Noch kein Konto? ';

  @override
  String get onboardingSignUpLink => 'Registrieren';

  @override
  String get onboardingPage1Title => 'Noten in\nBelohnungen umwandeln';

  @override
  String get onboardingPage1Body =>
      'Schüler verdienen Bonuspunkte für gute Noten. Eltern setzen die Belohnungen. Alle gewinnen.';

  @override
  String get onboardingPage2Title => 'Note fotografieren,\nsofort verdienen';

  @override
  String get onboardingPage2Body =>
      'Fotografiere jede benotete Schularbeit. Die App liest das Fach und die Note automatisch.';

  @override
  String get onboardingPage3Title => 'Fortschritt\ngemeinsam verfolgen';

  @override
  String get onboardingPage3Body =>
      'Eltern und Schüler sehen dieselben Erkenntnisse — Noten, Boni und Trends im Laufe der Zeit.';

  @override
  String get settingsTitle => 'Einstellungen';

  @override
  String get settingsSectionPreferences => 'Einstellungen';

  @override
  String get settingsSectionAccount => 'Konto';

  @override
  String get settingsSectionConnectedParents => 'Verbundene Eltern';

  @override
  String get settingsSectionApp => 'App';

  @override
  String get settingsAppearanceLabel => 'Erscheinungsbild';

  @override
  String get settingsThemeSystem => 'System';

  @override
  String get settingsThemeLight => 'Hell';

  @override
  String get settingsThemeDark => 'Dunkel';

  @override
  String get settingsLanguageLabel => 'Sprache';

  @override
  String get settingsLanguageAuto => 'Auto';

  @override
  String get settingsLanguageAutoSystem => 'Auto (System)';

  @override
  String get settingsEditProfile => 'Profil bearbeiten';

  @override
  String get settingsChangePassword => 'Passwort ändern';

  @override
  String get settingsChangeEmail => 'E-Mail ändern';

  @override
  String get settingsBiometricLogin => 'Biometrische Anmeldung';

  @override
  String get settingsBiometricVerifyFailed =>
      'Biometrie-Verifizierung fehlgeschlagen. Bitte erneut versuchen.';

  @override
  String get settingsDeleteAccount => 'Konto löschen';

  @override
  String get settingsDeleteAccountDialogTitle => 'Konto löschen';

  @override
  String get settingsDeleteAccountDialogContent =>
      'Damit wird dein Konto und alle Daten dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.';

  @override
  String get settingsDeleteAccountConfirm => 'Konto löschen';

  @override
  String get settingsCancel => 'Abbrechen';

  @override
  String get settingsAbout => 'Über';

  @override
  String get settingsLogOut => 'Abmelden';

  @override
  String get settingsNoParentsConnected => 'Keine Eltern verbunden';

  @override
  String get settingsScanQr => 'QR scannen';

  @override
  String get settingsAddAnotherParent => 'Weiteres Elternteil hinzufügen';

  @override
  String get settingsScanParentQrTitle => 'Eltern-QR-Code scannen';

  @override
  String get settingsScanQrInstructions =>
      'Richte die Kamera auf den QR-Code auf dem Elterngerät';

  @override
  String settingsConnectedSince(String date) {
    return 'Verbunden am $date';
  }

  @override
  String get settingsRemoveConnection => 'Verbindung trennen';

  @override
  String get settingsParentConnected => 'Elternteil verbunden!';

  @override
  String get settingsEditProfileTitle => 'Profil bearbeiten';

  @override
  String get settingsFullName => 'Vollständiger Name';

  @override
  String get settingsNameCannotBeEmpty => 'Name darf nicht leer sein';

  @override
  String get settingsProfileUpdated => 'Profil aktualisiert';

  @override
  String get settingsChangePasswordTitle => 'Passwort ändern';

  @override
  String get settingsNewPassword => 'Neues Passwort';

  @override
  String get settingsConfirmPassword => 'Passwort bestätigen';

  @override
  String get settingsEnterPassword => 'Passwort eingeben';

  @override
  String get settingsMin12Chars => 'Mindestens 12 Zeichen';

  @override
  String get settingsPasswordsDoNotMatch => 'Passwörter stimmen nicht überein';

  @override
  String get settingsPasswordChanged => 'Passwort geändert';

  @override
  String get settingsChangeEmailTitle => 'E-Mail ändern';

  @override
  String get settingsNewEmailAddress => 'Neue E-Mail-Adresse';

  @override
  String get settingsEnterEmail => 'E-Mail eingeben';

  @override
  String get settingsEnterValidEmail => 'Gültige E-Mail eingeben';

  @override
  String get settingsSendVerificationCode => 'Bestätigungscode senden';

  @override
  String get settingsSending => 'Wird gesendet…';

  @override
  String settingsCodeSentTo(String email) {
    return 'Wir haben einen 6-stelligen Code an $email gesendet.';
  }

  @override
  String get settingsVerificationCode => 'Bestätigungscode';

  @override
  String get settingsEnter6DigitCode => '6-stelligen Code eingeben';

  @override
  String get settingsEmailUpdated => 'E-Mail aktualisiert';

  @override
  String get settingsInvalidCode =>
      'Ungültiger oder abgelaufener Code. Bitte erneut versuchen.';

  @override
  String get settingsSave => 'Speichern';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Konto löschen fehlgeschlagen: $error';
  }

  @override
  String get settingsAboutLegalese => 'Notenbelohnungs-Tracker für Schüler';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Notenkonfiguration';

  @override
  String get settingsGradingConfigSubtitle =>
      'Tier-Multiplikatoren · Notenzyklus · Bonusverhältnis';

  @override
  String get settingsGradeTierMultipliers => 'Noten-Tier-Multiplikatoren';

  @override
  String get settingsOngoingNotesCycle => 'Laufender Notenzyklus';

  @override
  String settingsEditMultiplier(String label) {
    return 'Multiplikator bearbeiten: $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Konfiguration für $childName';
  }

  @override
  String get settingsCycleType => 'Zyklustyp';

  @override
  String get settingsBonusRatio => 'Bonusverhältnis';

  @override
  String get settingsTierBestLabel => 'Sehr gut (Note 1–2)';

  @override
  String get settingsTierSecondLabel => 'Gut (Note 3)';

  @override
  String get settingsTierThirdLabel => 'Befriedigend (Note 4)';

  @override
  String get settingsFailedToLoadChildren =>
      'Kinder konnten nicht geladen werden';

  @override
  String get settingsNoChildrenConnected => 'Keine Kinder verbunden';

  @override
  String dashboardHiName(String name) {
    return 'Hallo $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Verfolge deine Noten, verdiene Belohnungen';

  @override
  String get dashboardThisWeek => 'Diese Woche';

  @override
  String get dashboardRecentNotes => 'Aktuelle Notizen';

  @override
  String get dashboardSavedResults => 'Gespeicherte Ergebnisse';

  @override
  String get dashboardQuickCalculate => 'Schnellberechnung';

  @override
  String get dashboardCouldNotLoadNotes =>
      'Notizen konnten nicht geladen werden';

  @override
  String get dashboardNoNotesYet => 'Noch keine Notizen';

  @override
  String get dashboardCouldNotLoadResults =>
      'Ergebnisse konnten nicht geladen werden';

  @override
  String get dashboardNoSavedResultsYet =>
      'Noch keine gespeicherten Ergebnisse';

  @override
  String get calculatorTitle => 'Notenrechner';

  @override
  String get calculatorGradingSystem => 'Benotungssystem';

  @override
  String get calculatorClass => 'Klasse';

  @override
  String get calculatorTerm => 'Halbjahr';

  @override
  String get calculatorSchoolYear => 'Schuljahr';

  @override
  String get calculatorLabelOptional => 'Bezeichnung (optional)';

  @override
  String get calculatorGradePlanner => 'Notenplaner';

  @override
  String get calculatorGradePlannerHint =>
      'Klasse und Halbjahr oben einstellen, dann auf \"Fach hinzufügen\" tippen.';

  @override
  String get calculatorAddSubject => 'Fach hinzufügen';

  @override
  String get calculatorSearchSubjects => 'Fächer suchen…';

  @override
  String get calculatorGradeLabel => 'Note';

  @override
  String get calculatorWeightLabel => 'Gewichtung';

  @override
  String get calculatorWeightTooltip =>
      'Höhere Gewichtung = mehr Bonus. 2× für schwierigere Prüfungen verwenden.';

  @override
  String get calculatorSelectSubjectValidator => 'Bitte ein Fach auswählen';

  @override
  String get calculatorSelectGradeValidator => 'Bitte eine Note auswählen';

  @override
  String get calculatorCoreSubjects => 'Kernfächer';

  @override
  String get calculatorOther => 'Sonstige';

  @override
  String get calculatorTotalBonus => 'Gesamtbonus';

  @override
  String get calculatorSaveResult => 'Ergebnis speichern';

  @override
  String get calculatorResultSaved => 'Ergebnis gespeichert!';

  @override
  String get calculatorSaveChanges => 'Änderungen speichern';

  @override
  String get calculatorTierExcellent => 'Sehr gut';

  @override
  String get calculatorTierGood => 'Gut';

  @override
  String get calculatorTierSatisfactory => 'Befriedigend';

  @override
  String get calculatorTierBelow => 'Unter Schwelle';

  @override
  String get calculatorSettingsTooltip => 'Einstellungen';

  @override
  String get notesTitle => 'Notizen';

  @override
  String get notesNoNotesYet => 'Noch keine Notizen';

  @override
  String get notesTapToCaptureFirst =>
      'Tippe + um deine erste Note aufzunehmen';

  @override
  String get notesFailedToLoad => 'Notizen konnten nicht geladen werden';

  @override
  String get notesRetry => 'Wiederholen';

  @override
  String get notesViewCycleSummary => 'Zyklusbericht anzeigen';

  @override
  String get notesDeleteGradeTitle => 'Note löschen';

  @override
  String get notesDeleteGradeConfirm =>
      'Möchtest du diese Note wirklich löschen?';

  @override
  String get notesDelete => 'Löschen';

  @override
  String get notesCancel => 'Abbrechen';

  @override
  String get notesThisWeek => 'Diese Woche';

  @override
  String get notesLastWeek => 'Letzte Woche';

  @override
  String get noteDetailTitle => 'Notendetails';

  @override
  String get noteDetailCouldNotLoad => 'Notiz konnte nicht geladen werden';

  @override
  String get noteDetailNotFound => 'Note nicht gefunden';

  @override
  String get noteDetailDateCaptured => 'Aufnahmedatum';

  @override
  String get noteDetailQualityTier => 'Qualitätsstufe';

  @override
  String get noteDetailSettlement => 'Abrechnung';

  @override
  String get noteDetailSettled => 'Abgerechnet';

  @override
  String get noteDetailPending => 'Ausstehend';

  @override
  String get noteDetailTier1 => 'Stufe 1 — Sehr gut';

  @override
  String get noteDetailTier2 => 'Stufe 2 — Gut';

  @override
  String get noteDetailTier3 => 'Stufe 3 — Befriedigend';

  @override
  String get noteDetailTierBelow => 'Unter Schwelle';

  @override
  String get noteDetailDeleteTitle => 'Notiz löschen';

  @override
  String get noteDetailDeleteConfirm =>
      'Möchtest du diese Notiz wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.';

  @override
  String get noteDetailDelete => 'Löschen';

  @override
  String get noteDetailCancel => 'Abbrechen';

  @override
  String get captureTitle => 'Note aufnehmen';

  @override
  String get capturePositionGrade =>
      'Positioniere die Note so, dass sie gut sichtbar ist';

  @override
  String get captureChooseFromGallery => 'Aus Galerie wählen';

  @override
  String get captureTakePhoto => 'Foto aufnehmen';

  @override
  String get captureLoadingEntry => 'Noteneingabe wird geladen...';

  @override
  String get captureEnterGrade => 'Note eingeben';

  @override
  String get captureSelectSubjectGrade => 'Fach und Note auswählen';

  @override
  String get captureSubjectLabel => 'Fach';

  @override
  String get captureGradeLabel => 'Note';

  @override
  String get captureNoSubjectsLoaded => 'Keine Fächer geladen';

  @override
  String get captureSelectSubjectAndGrade => 'Bitte Fach und Note auswählen';

  @override
  String get captureSaveGrade => 'Note speichern';

  @override
  String get captureCancel => 'Abbrechen';

  @override
  String get cycleSummaryTitle => 'Zyklusbericht';

  @override
  String get cycleSummaryCouldNotLoad => 'Noten konnten nicht geladen werden';

  @override
  String get cycleSummaryWeekly => 'Wöchentlich';

  @override
  String get cycleSummaryNotesInCycle => 'Notizen in diesem Zyklus';

  @override
  String get cycleSummaryNoGrades => 'Keine Noten in diesem Zeitraum';

  @override
  String get cycleSummaryPositive => 'Positiv';

  @override
  String get cycleSummaryNet => 'Netto';

  @override
  String get resultsTitle => 'Gespeicherte Ergebnisse';

  @override
  String get resultsFailedToLoad => 'Ergebnisse konnten nicht geladen werden';

  @override
  String get resultsRetry => 'Wiederholen';

  @override
  String get resultsNoResults => 'Noch keine gespeicherten Ergebnisse';

  @override
  String get resultsUseCalculator =>
      'Verwende den Rechner, um dein erstes Halbjahresergebnis zu speichern.';

  @override
  String get resultsOpenCalculator => 'Rechner öffnen';

  @override
  String get termDetailTitle => 'Halbjahresergebnis';

  @override
  String get termDetailCouldNotLoad => 'Halbjahr konnte nicht geladen werden';

  @override
  String get termDetailNotFound => 'Halbjahr nicht gefunden';

  @override
  String get termDetailAverage => 'Durchschnitt';

  @override
  String get termDetailBonus => 'Bonus';

  @override
  String get termDetailSubjects => 'Fächer';

  @override
  String get termDetailSubjectBreakdown => 'Fächerübersicht';

  @override
  String get insightsTitle => 'Erkenntnisse';

  @override
  String get insightsFailedToLoad =>
      'Erkenntnisse konnten nicht geladen werden';

  @override
  String get insightsRetry => 'Wiederholen';

  @override
  String get insightsNoGradesYet => 'Noch keine Noten';

  @override
  String get insightsAddGradesHint =>
      'Noten in der Notizen-Registerkarte hinzufügen.';

  @override
  String get insightsBonusPointsLastMonths => 'Bonuspunkte — Letzte 6 Monate';

  @override
  String get insightsNoBonusPoints =>
      'Keine Bonuspunkte in den letzten 6 Monaten';

  @override
  String get insightsGradeDistribution => 'Notenverteilung';

  @override
  String get insightsThisWeek => 'Diese Woche';

  @override
  String get insightsAllTime => 'Gesamt';

  @override
  String get insightsGrades => 'Noten';

  @override
  String get insightsEarned => 'Verdient';

  @override
  String get insightsUnsettled => 'Nicht abgerechnet';

  @override
  String get insightsTotalPts => 'Gesamtpunkte';

  @override
  String get insightsPending => 'Ausstehend';

  @override
  String get insightsTierBest => 'Sehr gut (1–1,4)';

  @override
  String get insightsTierGood => 'Gut (1,5–2,4)';

  @override
  String get insightsTierOk => 'Befriedigend (2,5–3,4)';

  @override
  String get insightsTierBelow => 'Ungenügend (3,5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Hallo $name';
  }

  @override
  String get parentDashboardOverview => 'Übersicht deiner Kinder';

  @override
  String get parentDashboardSummary => 'Zusammenfassung';

  @override
  String get parentDashboardChildren => 'Kinder';

  @override
  String get parentDashboardPending => 'Ausstehend';

  @override
  String get parentDashboardGrades => 'Noten';

  @override
  String get parentDashboardChildrenOverview => 'Kinderübersicht';

  @override
  String get parentDashboardNoChildrenConnected =>
      'Noch keine Kinder verbunden.\nGehe zum Tab Kinder, um ein Kind hinzuzufügen.';

  @override
  String get parentDashboardRecentGrade => 'Aktuelle Note';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'Kinderdaten konnten nicht geladen werden';

  @override
  String get childrenTitle => 'Kinder';

  @override
  String get childrenNoChildrenConnected => 'Keine Kinder verbunden';

  @override
  String get childrenShareQrHint =>
      'Teile einen Einladungs-QR-Code, um einen Schüler zu verbinden';

  @override
  String get childrenShowInviteQr => 'Einladungs-QR anzeigen';

  @override
  String get childrenInviteStudent => 'Schüler einladen';

  @override
  String get childrenScanCodeHint =>
      'Bitte den Schüler, diesen Code in der App zu scannen';

  @override
  String get childrenFailedToCreateInvite =>
      'Einladung konnte nicht erstellt werden';

  @override
  String get childrenRetry => 'Wiederholen';

  @override
  String get childrenClose => 'Schließen';

  @override
  String get childrenFailedToLoad => 'Kinder konnten nicht geladen werden';

  @override
  String get childDetailTitle => 'Kinddetails';

  @override
  String get childDetailCouldNotLoad => 'Daten konnten nicht geladen werden';

  @override
  String get childDetailNotFound => 'Kind nicht gefunden';

  @override
  String get childDetailTermResults => 'Halbjahresergebnisse';

  @override
  String get childDetailNoTermResults =>
      'Noch keine Halbjahresergebnisse gespeichert.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'Halbjahresergebnisse konnten nicht geladen werden';

  @override
  String get childDetailQuickGrades => 'Schnellnoten';

  @override
  String get childDetailNoQuickGrades => 'Noch keine Schnellnoten';

  @override
  String get childDetailGrades => 'Noten';

  @override
  String get childDetailTotalPts => 'Gesamtpunkte';

  @override
  String get childDetailPending => 'Ausstehend';

  @override
  String get childDetailSettled => 'Abgerechnet';

  @override
  String get childDetailBonus => 'Bonus';

  @override
  String get childDetailStatus => 'Status';

  @override
  String get rewardsTitle => 'Belohnungen';

  @override
  String get rewardsTabQuickGrades => 'Schnellnoten';

  @override
  String get rewardsTabSummary => 'Zusammenfassung';

  @override
  String get rewardsNoChildrenConnected => 'Keine Kinder verbunden';

  @override
  String get rewardsFailedToLoadData =>
      'Belohnungsdaten konnten nicht geladen werden';

  @override
  String get rewardsRetry => 'Wiederholen';

  @override
  String get rewardsNoPendingGrades => 'Keine ausstehenden Noten';

  @override
  String get rewardsSettle => 'Abrechnen';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Bonus für $childName abrechnen';
  }

  @override
  String get rewardsAmountToTransfer => 'Zu übertragender Betrag';

  @override
  String get rewardsCancel => 'Abbrechen';

  @override
  String get rewardsConfirmSettle => 'Abrechnung bestätigen';

  @override
  String get rewardsSettled => 'Abgerechnet!';

  @override
  String get parentInsightsTitle => 'Erkenntnisse';

  @override
  String get parentInsightsFailedToLoad =>
      'Erkenntnisse konnten nicht geladen werden';

  @override
  String get parentInsightsRetry => 'Wiederholen';

  @override
  String get parentInsightsNoInsights => 'Noch keine Erkenntnisse';

  @override
  String get parentInsightsNoInsightsHint =>
      'Kinder verbinden, um ihre Notenerkenntnisse zu sehen';

  @override
  String get parentInsightsAllChildrenSummary =>
      'Alle Kinder — Zusammenfassung';

  @override
  String get parentInsightsTotalEarned => 'Gesamt verdient';

  @override
  String get parentInsightsPending => 'Ausstehend';

  @override
  String get parentInsightsChildren => 'Kinder';

  @override
  String get navHome => 'Start';

  @override
  String get navCalculator => 'Rechner';

  @override
  String parentDashboardChildSubtitle(int count, int pts) {
    return '$count Noten · $pts Pkt. ausstehend';
  }

  @override
  String get termDetailDeleteTitle => 'Ergebnis löschen';

  @override
  String get termDetailDeleteConfirm =>
      'Bist du sicher, dass du dieses Ergebnis löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.';

  @override
  String get termDetailDelete => 'Löschen';

  @override
  String get termDetailEditLabel => 'Bezeichnung bearbeiten';

  @override
  String get calculatorLabelHint => 'z.B. Abschlussprüfung';

  @override
  String studentNotesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Notizen',
      one: '$count Notiz',
    );
    return '$_temp0';
  }

  @override
  String calculatorNoSubjectsMatch(String query) {
    return 'Keine Fächer für \"$query\" gefunden';
  }

  @override
  String get calculatorRemoveSubject => 'Entfernen';

  @override
  String calculatorFailedToSave(String error) {
    return 'Speichern fehlgeschlagen: $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Fächer',
      one: '$count Fach',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'z.B. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Noten',
      one: '$count Note',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'Ansehen';

  @override
  String childrenPtsPending(int pts) {
    return '$pts Pkt. ausstehend';
  }

  @override
  String rewardsSummarySubtitle(int count, int pts) {
    return '$count Noten · $pts Pkt. gesamt';
  }

  @override
  String get subjectFallback => 'Fach';

  @override
  String genericFailedError(String error) {
    return 'Fehler: $error';
  }

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Bitte warte $seconds Sekunden, bevor du einen neuen Code anforderst.';
  }

  @override
  String get cycleTypeDaily => 'Täglich';

  @override
  String get cycleTypeWeekly => 'Wöchentlich';

  @override
  String get cycleTypeMonthly => 'Monatlich';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Netto: $pts Pkt.';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Code: $code';
  }

  @override
  String get ptsAbbr => 'Pkt';

  @override
  String get bonusPtsLabel => 'Bonuspkt';

  @override
  String get totalGradesLabel => 'Noten gesamt';

  @override
  String get classLabel => 'Klasse';

  @override
  String get ratioLabel => 'Anteil';

  @override
  String get genericRequestFailed => 'Anfrage fehlgeschlagen';

  @override
  String get parentFallback => 'Elternteil';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Geburtsdatum';

  @override
  String get registerDateOfBirthHint => 'Geburtsdatum wählen';

  @override
  String get registerDateOfBirthRequired => 'Bitte Geburtsdatum auswählen';

  @override
  String get captureClassLevelLabel => 'Klasse';
}
