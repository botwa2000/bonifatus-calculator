// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'Bonifatus';

  @override
  String get loginWelcomeBack => 'Bon retour';

  @override
  String get loginSignInSubtitle => 'Connecte-toi à ton compte';

  @override
  String get loginEmailLabel => 'E-mail';

  @override
  String get loginEmailValidator => 'Entre une adresse e-mail valide';

  @override
  String get loginPasswordLabel => 'Mot de passe';

  @override
  String get loginPasswordValidator => 'Entre ton mot de passe';

  @override
  String get loginForgotPassword => 'Mot de passe oublié ?';

  @override
  String get loginSignInButton => 'Se connecter';

  @override
  String get loginBiometricButton => 'Se connecter avec la biométrie';

  @override
  String get loginNoAccountPrompt => 'Pas encore de compte ? ';

  @override
  String get loginSignUpLink => 'S\'inscrire';

  @override
  String get registerStep1Title => 'Comment tu t\'appelles ?';

  @override
  String get registerStep1Subtitle =>
      'C\'est ainsi que tu apparaîtras aux autres.';

  @override
  String get registerFullNameLabel => 'Nom complet';

  @override
  String get registerContinueButton => 'Continuer';

  @override
  String get registerStep2Title => 'Je suis...';

  @override
  String get registerStep2Subtitle =>
      'Choisis ton rôle pour la bonne expérience.';

  @override
  String get registerRoleStudentTitle => 'Élève';

  @override
  String get registerRoleStudentSubtitle =>
      'Suivre mes notes et gagner des récompenses';

  @override
  String get registerRoleParentTitle => 'Parent';

  @override
  String get registerRoleParentSubtitle =>
      'Définir des récompenses et surveiller les progrès';

  @override
  String get registerStep3Title => 'Créer ton compte';

  @override
  String get registerStep3Subtitle => 'Presque là !';

  @override
  String get registerEmailLabel => 'E-mail';

  @override
  String get registerPasswordLabel => 'Mot de passe';

  @override
  String get registerConfirmPasswordLabel => 'Confirmer le mot de passe';

  @override
  String get registerCreateAccountButton => 'Créer un compte';

  @override
  String get registerAlreadyHaveAccount => 'Déjà un compte ? ';

  @override
  String get registerSignInLink => 'Se connecter';

  @override
  String get registerPasswordsDoNotMatch =>
      'Les mots de passe ne correspondent pas';

  @override
  String get registerPasswordTooShort =>
      'Le mot de passe doit contenir au moins 12 caractères';

  @override
  String get registerFailed => 'Inscription échouée. Veuillez réessayer.';

  @override
  String get forgotPasswordAppBarTitle => 'Réinitialiser le mot de passe';

  @override
  String get forgotPasswordStep1Title => 'Mot de passe oublié ?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Entre ton e-mail et nous t\'enverrons un code de réinitialisation.';

  @override
  String get forgotPasswordEmailLabel => 'E-mail';

  @override
  String get forgotPasswordSendCodeButton => 'Envoyer le code';

  @override
  String get forgotPasswordStep2Title => 'Vérifie tes e-mails';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Entre le code que nous avons envoyé à $email.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Code de réinitialisation';

  @override
  String get forgotPasswordNewPasswordLabel => 'Nouveau mot de passe';

  @override
  String get forgotPasswordResetButton => 'Réinitialiser le mot de passe';

  @override
  String get forgotPasswordResendCode => 'Renvoyer le code';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Mot de passe mis à jour ! Connecte-toi avec ton nouveau mot de passe.';

  @override
  String get verifyEmailAppBarTitle => 'Vérifier l\'e-mail';

  @override
  String get verifyEmailTitle => 'Vérifie tes e-mails';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Entre le code à 6 chiffres envoyé à\n$email';
  }

  @override
  String get verifyEmailButton => 'Vérifier';

  @override
  String get verifyEmailFailed => 'Vérification échouée. Veuillez réessayer.';

  @override
  String get onboardingSkip => 'Passer';

  @override
  String get onboardingNext => 'Suivant';

  @override
  String get onboardingGetStarted => 'Commencer';

  @override
  String get onboardingNoAccountPrompt => 'Pas encore de compte ? ';

  @override
  String get onboardingSignUpLink => 'S\'inscrire';

  @override
  String get onboardingPage1Title => 'Transforme tes notes\nen récompenses';

  @override
  String get onboardingPage1Body =>
      'Les élèves gagnent des points bonus pour chaque bonne note. Les parents définissent les récompenses. Tout le monde gagne.';

  @override
  String get onboardingPage2Title =>
      'Photographie une note,\ngagne instantanément';

  @override
  String get onboardingPage2Body =>
      'Photographie tout travail scolaire noté. L\'application lit la matière et la note automatiquement.';

  @override
  String get onboardingPage3Title => 'Suivre les progrès\nensemble';

  @override
  String get onboardingPage3Body =>
      'Parents et élèves voient les mêmes informations — notes, bonus et tendances au fil du temps.';

  @override
  String get settingsTitle => 'Paramètres';

  @override
  String get settingsSectionPreferences => 'Préférences';

  @override
  String get settingsSectionAccount => 'Compte';

  @override
  String get settingsSectionConnectedParents => 'Parents connectés';

  @override
  String get settingsSectionApp => 'Application';

  @override
  String get settingsAppearanceLabel => 'Apparence';

  @override
  String get settingsThemeSystem => 'Système';

  @override
  String get settingsThemeLight => 'Clair';

  @override
  String get settingsThemeDark => 'Sombre';

  @override
  String get settingsLanguageLabel => 'Langue';

  @override
  String get settingsLanguageAuto => 'Auto';

  @override
  String get settingsLanguageAutoSystem => 'Auto (Système)';

  @override
  String get settingsEditProfile => 'Modifier le profil';

  @override
  String get settingsChangePassword => 'Changer le mot de passe';

  @override
  String get settingsChangeEmail => 'Changer l\'e-mail';

  @override
  String get settingsBiometricLogin => 'Connexion biométrique';

  @override
  String get settingsBiometricVerifyFailed =>
      'Échec de la vérification biométrique. Veuillez réessayer.';

  @override
  String get settingsDeleteAccount => 'Supprimer le compte';

  @override
  String get settingsDeleteAccountDialogTitle => 'Supprimer le compte';

  @override
  String get settingsDeleteAccountDialogContent =>
      'Cela supprimera définitivement ton compte et toutes tes données. Cette action est irréversible.';

  @override
  String get settingsDeleteAccountConfirm => 'Supprimer le compte';

  @override
  String get settingsCancel => 'Annuler';

  @override
  String get settingsAbout => 'À propos';

  @override
  String get settingsLogOut => 'Se déconnecter';

  @override
  String get settingsNoParentsConnected => 'Aucun parent connecté';

  @override
  String get settingsScanQr => 'Scanner QR';

  @override
  String get settingsAddAnotherParent => 'Ajouter un autre parent';

  @override
  String get settingsScanParentQrTitle => 'Scanner le QR du parent';

  @override
  String get settingsScanQrInstructions =>
      'Pointe la caméra vers le code QR affiché sur l\'appareil parent';

  @override
  String settingsConnectedSince(String date) {
    return 'Connecté le $date';
  }

  @override
  String get settingsRemoveConnection => 'Supprimer la connexion';

  @override
  String get settingsParentConnected => 'Parent connecté !';

  @override
  String get settingsEditProfileTitle => 'Modifier le profil';

  @override
  String get settingsFullName => 'Nom complet';

  @override
  String get settingsNameCannotBeEmpty => 'Le nom ne peut pas être vide';

  @override
  String get settingsProfileUpdated => 'Profil mis à jour';

  @override
  String get settingsChangePasswordTitle => 'Changer le mot de passe';

  @override
  String get settingsNewPassword => 'Nouveau mot de passe';

  @override
  String get settingsConfirmPassword => 'Confirmer le mot de passe';

  @override
  String get settingsEnterPassword => 'Entre un mot de passe';

  @override
  String get settingsMin12Chars => 'Minimum 12 caractères';

  @override
  String get settingsPasswordsDoNotMatch =>
      'Les mots de passe ne correspondent pas';

  @override
  String get settingsPasswordChanged => 'Mot de passe changé';

  @override
  String get settingsChangeEmailTitle => 'Changer l\'e-mail';

  @override
  String get settingsNewEmailAddress => 'Nouvelle adresse e-mail';

  @override
  String get settingsEnterEmail => 'Entre un e-mail';

  @override
  String get settingsEnterValidEmail => 'Entre un e-mail valide';

  @override
  String get settingsSendVerificationCode => 'Envoyer le code de vérification';

  @override
  String get settingsSending => 'Envoi en cours…';

  @override
  String settingsCodeSentTo(String email) {
    return 'Nous avons envoyé un code à 6 chiffres à $email.';
  }

  @override
  String get settingsVerificationCode => 'Code de vérification';

  @override
  String get settingsEnter6DigitCode => 'Entre le code à 6 chiffres';

  @override
  String get settingsEmailUpdated => 'E-mail mis à jour';

  @override
  String get settingsInvalidCode =>
      'Code invalide ou expiré. Veuillez réessayer.';

  @override
  String get settingsSave => 'Enregistrer';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Échec de la suppression du compte : $error';
  }

  @override
  String get settingsAboutLegalese =>
      'Suivi des récompenses de notes pour les élèves';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Configuration des notes';

  @override
  String get settingsGradingConfigSubtitle =>
      'Multiplicateurs de niveau · cycle · ratio de bonus';

  @override
  String get settingsGradeTierMultipliers =>
      'Multiplicateurs de niveau de note';

  @override
  String get settingsOngoingNotesCycle => 'Cycle de notes en cours';

  @override
  String settingsEditMultiplier(String label) {
    return 'Modifier le multiplicateur : $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Configuration pour $childName';
  }

  @override
  String get settingsCycleType => 'Type de cycle';

  @override
  String get settingsBonusRatio => 'Ratio de bonus';

  @override
  String get settingsTierBestLabel => 'Excellent (Note 1–2)';

  @override
  String get settingsTierSecondLabel => 'Bien (Note 3)';

  @override
  String get settingsTierThirdLabel => 'Satisfaisant (Note 4)';

  @override
  String get settingsFailedToLoadChildren =>
      'Impossible de charger les enfants';

  @override
  String get settingsNoChildrenConnected => 'Aucun enfant connecté';

  @override
  String dashboardHiName(String name) {
    return 'Salut $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Suis tes notes, gagne des récompenses';

  @override
  String get dashboardThisWeek => 'Cette semaine';

  @override
  String get dashboardRecentNotes => 'Notes récentes';

  @override
  String get dashboardSavedResults => 'Résultats enregistrés';

  @override
  String get dashboardQuickCalculate => 'Calcul rapide';

  @override
  String get dashboardCouldNotLoadNotes => 'Impossible de charger les notes';

  @override
  String get dashboardNoNotesYet => 'Pas encore de notes';

  @override
  String get dashboardCouldNotLoadResults =>
      'Impossible de charger les résultats';

  @override
  String get dashboardNoSavedResultsYet =>
      'Pas encore de résultats enregistrés';

  @override
  String get calculatorTitle => 'Calculateur de notes';

  @override
  String get calculatorGradingSystem => 'Système de notation';

  @override
  String get calculatorClass => 'Classe';

  @override
  String get calculatorTerm => 'Semestre';

  @override
  String get calculatorSchoolYear => 'Année scolaire';

  @override
  String get calculatorLabelOptional => 'Étiquette (optionnel)';

  @override
  String get calculatorGradePlanner => 'Planificateur de notes';

  @override
  String get calculatorGradePlannerHint =>
      'Définis ta classe et ton semestre, puis appuie sur \"Ajouter une matière\".';

  @override
  String get calculatorAddSubject => 'Ajouter une matière';

  @override
  String get calculatorSearchSubjects => 'Rechercher des matières…';

  @override
  String get calculatorGradeLabel => 'Note';

  @override
  String get calculatorWeightLabel => 'Pondération';

  @override
  String get calculatorWeightTooltip =>
      'Pondération plus élevée = plus de bonus. Utilise 2× pour les examens difficiles.';

  @override
  String get calculatorSelectSubjectValidator =>
      'Veuillez sélectionner une matière';

  @override
  String get calculatorSelectGradeValidator => 'Veuillez sélectionner une note';

  @override
  String get calculatorCoreSubjects => 'Matières principales';

  @override
  String get calculatorOther => 'Autres';

  @override
  String get calculatorTotalBonus => 'Bonus total';

  @override
  String get calculatorSaveResult => 'Enregistrer le résultat';

  @override
  String get calculatorResultSaved => 'Résultat enregistré !';

  @override
  String get calculatorSaveChanges => 'Enregistrer les modifications';

  @override
  String get calculatorTierExcellent => 'Excellent';

  @override
  String get calculatorTierGood => 'Bien';

  @override
  String get calculatorTierSatisfactory => 'Satisfaisant';

  @override
  String get calculatorTierBelow => 'En dessous du seuil';

  @override
  String get calculatorSettingsTooltip => 'Paramètres';

  @override
  String get notesTitle => 'Notes';

  @override
  String get notesNoNotesYet => 'Pas encore de notes';

  @override
  String get notesTapToCaptureFirst =>
      'Appuie sur + pour capturer ta première note';

  @override
  String get notesFailedToLoad => 'Impossible de charger les notes';

  @override
  String get notesRetry => 'Réessayer';

  @override
  String get notesViewCycleSummary => 'Voir le résumé du cycle';

  @override
  String get notesDeleteGradeTitle => 'Supprimer la note';

  @override
  String get notesDeleteGradeConfirm =>
      'Es-tu sûr de vouloir supprimer cette note ?';

  @override
  String get notesDelete => 'Supprimer';

  @override
  String get notesCancel => 'Annuler';

  @override
  String get notesThisWeek => 'Cette semaine';

  @override
  String get notesLastWeek => 'La semaine dernière';

  @override
  String get noteDetailTitle => 'Détail de la note';

  @override
  String get noteDetailCouldNotLoad => 'Impossible de charger la note';

  @override
  String get noteDetailNotFound => 'Note non trouvée';

  @override
  String get noteDetailDateCaptured => 'Date de capture';

  @override
  String get noteDetailQualityTier => 'Niveau de qualité';

  @override
  String get noteDetailSettlement => 'Règlement';

  @override
  String get noteDetailSettled => 'Réglé';

  @override
  String get noteDetailPending => 'En attente';

  @override
  String get noteDetailTier1 => 'Niveau 1 — Excellent';

  @override
  String get noteDetailTier2 => 'Niveau 2 — Bien';

  @override
  String get noteDetailTier3 => 'Niveau 3 — Satisfaisant';

  @override
  String get noteDetailTierBelow => 'En dessous du seuil';

  @override
  String get noteDetailDeleteTitle => 'Supprimer la note';

  @override
  String get noteDetailDeleteConfirm =>
      'Es-tu sûr de vouloir supprimer cette note ? Cette action est irréversible.';

  @override
  String get noteDetailDelete => 'Supprimer';

  @override
  String get noteDetailCancel => 'Annuler';

  @override
  String get captureTitle => 'Capturer une note';

  @override
  String get capturePositionGrade =>
      'Positionne la note pour qu\'elle soit clairement visible';

  @override
  String get captureChooseFromGallery => 'Choisir dans la galerie';

  @override
  String get captureTakePhoto => 'Prendre une photo';

  @override
  String get captureLoadingEntry => 'Chargement de la saisie de note...';

  @override
  String get captureEnterGrade => 'Entrer une note';

  @override
  String get captureSelectSubjectGrade =>
      'Sélectionner la matière et la valeur de la note';

  @override
  String get captureSubjectLabel => 'Matière';

  @override
  String get captureGradeLabel => 'Note';

  @override
  String get captureNoSubjectsLoaded => 'Aucune matière chargée';

  @override
  String get captureSelectSubjectAndGrade =>
      'Veuillez sélectionner une matière et une note';

  @override
  String get captureSaveGrade => 'Enregistrer la note';

  @override
  String get captureCancel => 'Annuler';

  @override
  String get cycleSummaryTitle => 'Résumé du cycle';

  @override
  String get cycleSummaryCouldNotLoad => 'Impossible de charger les notes';

  @override
  String get cycleSummaryWeekly => 'Hebdomadaire';

  @override
  String get cycleSummaryNotesInCycle => 'Notes dans ce cycle';

  @override
  String get cycleSummaryNoGrades => 'Aucune note dans cette période';

  @override
  String get cycleSummaryPositive => 'Positif';

  @override
  String get cycleSummaryNet => 'Net';

  @override
  String get resultsTitle => 'Résultats enregistrés';

  @override
  String get resultsFailedToLoad => 'Impossible de charger les résultats';

  @override
  String get resultsRetry => 'Réessayer';

  @override
  String get resultsNoResults => 'Pas encore de résultats enregistrés';

  @override
  String get resultsUseCalculator =>
      'Utilise le calculateur pour enregistrer ton premier résultat semestriel.';

  @override
  String get resultsOpenCalculator => 'Ouvrir le calculateur';

  @override
  String get termDetailTitle => 'Résultat semestriel';

  @override
  String get termDetailCouldNotLoad => 'Impossible de charger le semestre';

  @override
  String get termDetailNotFound => 'Semestre non trouvé';

  @override
  String get termDetailAverage => 'Moyenne';

  @override
  String get termDetailBonus => 'Bonus';

  @override
  String get termDetailSubjects => 'Matières';

  @override
  String get termDetailSubjectBreakdown => 'Détail par matière';

  @override
  String get insightsTitle => 'Analyses';

  @override
  String get insightsFailedToLoad => 'Impossible de charger les analyses';

  @override
  String get insightsRetry => 'Réessayer';

  @override
  String get insightsNoGradesYet => 'Pas encore de notes';

  @override
  String get insightsAddGradesHint =>
      'Ajoute des notes dans l\'onglet Notes pour voir les analyses.';

  @override
  String get insightsBonusPointsLastMonths => 'Points bonus — 6 derniers mois';

  @override
  String get insightsNoBonusPoints =>
      'Aucun point bonus dans les 6 derniers mois';

  @override
  String get insightsGradeDistribution => 'Distribution des notes';

  @override
  String get insightsThisWeek => 'Cette semaine';

  @override
  String get insightsAllTime => 'Tout le temps';

  @override
  String get insightsGrades => 'Notes';

  @override
  String get insightsEarned => 'Gagnés';

  @override
  String get insightsUnsettled => 'Non réglés';

  @override
  String get insightsTotalPts => 'Total pts';

  @override
  String get insightsPending => 'En attente';

  @override
  String get insightsTierBest => 'Excellent (1–1,4)';

  @override
  String get insightsTierGood => 'Bien (1,5–2,4)';

  @override
  String get insightsTierOk => 'Passable (2,5–3,4)';

  @override
  String get insightsTierBelow => 'Insuffisant (3,5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Salut $name';
  }

  @override
  String get parentDashboardOverview => 'Vue d\'ensemble de tes enfants';

  @override
  String get parentDashboardSummary => 'Résumé';

  @override
  String get parentDashboardChildren => 'Enfants';

  @override
  String get parentDashboardPending => 'En attente';

  @override
  String get parentDashboardGrades => 'Notes';

  @override
  String get parentDashboardChildrenOverview => 'Aperçu des enfants';

  @override
  String get parentDashboardNoChildrenConnected =>
      'Aucun enfant connecté.\nVa dans l\'onglet Enfants pour en ajouter un.';

  @override
  String get parentDashboardRecentGrade => 'Note récente';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'Impossible de charger les données des enfants';

  @override
  String get childrenTitle => 'Enfants';

  @override
  String get childrenNoChildrenConnected => 'Aucun enfant connecté';

  @override
  String get childrenShareQrHint =>
      'Partage un QR code d\'invitation pour connecter un élève';

  @override
  String get childrenShowInviteQr => 'Afficher le QR d\'invitation';

  @override
  String get childrenInviteStudent => 'Inviter un élève';

  @override
  String get childrenScanCodeHint =>
      'Demande à l\'élève de scanner ce code dans son application';

  @override
  String get childrenFailedToCreateInvite =>
      'Impossible de créer l\'invitation';

  @override
  String get childrenRetry => 'Réessayer';

  @override
  String get childrenClose => 'Fermer';

  @override
  String get childrenFailedToLoad => 'Impossible de charger les enfants';

  @override
  String get childDetailTitle => 'Détail de l\'enfant';

  @override
  String get childDetailCouldNotLoad => 'Impossible de charger les données';

  @override
  String get childDetailNotFound => 'Enfant non trouvé';

  @override
  String get childDetailTermResults => 'Résultats semestriels';

  @override
  String get childDetailNoTermResults => 'Pas encore de résultats semestriels.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'Impossible de charger les résultats semestriels';

  @override
  String get childDetailQuickGrades => 'Notes rapides';

  @override
  String get childDetailNoQuickGrades => 'Pas encore de notes rapides';

  @override
  String get childDetailGrades => 'Notes';

  @override
  String get childDetailTotalPts => 'Total pts';

  @override
  String get childDetailPending => 'En attente';

  @override
  String get childDetailSettled => 'Réglé';

  @override
  String get childDetailBonus => 'Bonus';

  @override
  String get childDetailStatus => 'Statut';

  @override
  String get rewardsTitle => 'Récompenses';

  @override
  String get rewardsTabQuickGrades => 'Notes rapides';

  @override
  String get rewardsTabSummary => 'Résumé';

  @override
  String get rewardsNoChildrenConnected => 'Aucun enfant connecté';

  @override
  String get rewardsFailedToLoadData =>
      'Impossible de charger les données de récompenses';

  @override
  String get rewardsRetry => 'Réessayer';

  @override
  String get rewardsNoPendingGrades => 'Aucune note en attente';

  @override
  String get rewardsSettle => 'Régler';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Régler le bonus pour $childName';
  }

  @override
  String get rewardsAmountToTransfer => 'Montant à transférer';

  @override
  String get rewardsCancel => 'Annuler';

  @override
  String get rewardsConfirmSettle => 'Confirmer le règlement';

  @override
  String get rewardsSettled => 'Réglé !';

  @override
  String get parentInsightsTitle => 'Analyses';

  @override
  String get parentInsightsFailedToLoad => 'Impossible de charger les analyses';

  @override
  String get parentInsightsRetry => 'Réessayer';

  @override
  String get parentInsightsNoInsights => 'Pas encore d\'analyses';

  @override
  String get parentInsightsNoInsightsHint =>
      'Connecte des enfants pour voir leurs analyses de notes';

  @override
  String get parentInsightsAllChildrenSummary => 'Tous les enfants — Résumé';

  @override
  String get parentInsightsTotalEarned => 'Total gagné';

  @override
  String get parentInsightsPending => 'En attente';

  @override
  String get parentInsightsChildren => 'Enfants';

  @override
  String get navHome => 'Accueil';

  @override
  String get navCalculator => 'Calculatrice';

  @override
  String parentDashboardChildSubtitle(int count, int pts) {
    return '$count notes · $pts pts en attente';
  }

  @override
  String get termDetailDeleteTitle => 'Supprimer le résultat';

  @override
  String get termDetailDeleteConfirm =>
      'Êtes-vous sûr de vouloir supprimer ce résultat ? Cette action est irréversible.';

  @override
  String get termDetailDelete => 'Supprimer';

  @override
  String get termDetailEditLabel => 'Modifier l\'intitulé';

  @override
  String get termSettledBadge => 'Réglé';

  @override
  String get termOpenBadge => 'Ouvert';

  @override
  String get calculatorLabelHint => 'ex. Examen final';

  @override
  String studentNotesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count notes',
      one: '$count note',
    );
    return '$_temp0';
  }

  @override
  String calculatorNoSubjectsMatch(String query) {
    return 'Aucune matière ne correspond à \"$query\"';
  }

  @override
  String get calculatorRemoveSubject => 'Supprimer';

  @override
  String calculatorFailedToSave(String error) {
    return 'Échec de l\'enregistrement : $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count matières',
      one: '$count matière',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'ex. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count notes',
      one: '$count note',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'Voir';

  @override
  String childrenPtsPending(int pts) {
    return '$pts pts en attente';
  }

  @override
  String rewardsSummarySubtitle(int count, int pts) {
    return '$count notes · $pts pts au total';
  }

  @override
  String get subjectFallback => 'Matière';

  @override
  String genericFailedError(String error) {
    return 'Erreur : $error';
  }

  @override
  String get errorLoadingConfig => 'Impossible de charger la configuration';

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Veuillez attendre $seconds secondes avant de demander un autre code.';
  }

  @override
  String get cycleTypeDaily => 'Quotidien';

  @override
  String get cycleTypeWeekly => 'Hebdomadaire';

  @override
  String get cycleTypeMonthly => 'Mensuel';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Net : $pts pts';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Code : $code';
  }

  @override
  String get ptsAbbr => 'pts';

  @override
  String get bonusPtsLabel => 'pts bonus';

  @override
  String get totalGradesLabel => 'notes au total';

  @override
  String get classLabel => 'Classe';

  @override
  String get ratioLabel => 'ratio';

  @override
  String get genericRequestFailed => 'Échec de la requête';

  @override
  String get parentFallback => 'Parent';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Date de naissance';

  @override
  String get registerDateOfBirthHint => 'Choisir la date de naissance';

  @override
  String get registerDateOfBirthRequired =>
      'Veuillez sélectionner votre date de naissance';

  @override
  String get captureClassLevelLabel => 'Niveau de classe';

  @override
  String get captureAnalyzingImage => 'Analyse de l\'image…';

  @override
  String get captureDetectedHint => 'Note détectée — vérifier et confirmer';

  @override
  String get captureReviewGrades => 'Vérifier les notes détectées';

  @override
  String captureNGradesDetected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count notes détectées',
      one: '1 note détectée',
      zero: 'Aucune note détectée',
    );
    return '$_temp0';
  }

  @override
  String get captureAddEntry => 'Ajouter une entrée';

  @override
  String captureSaveAll(int count) {
    return 'Enregistrer $count';
  }

  @override
  String get captureSelectSubject => 'Appuyer pour sélectionner';

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
  String get termTypeAnnual => 'Annuel';

  @override
  String get nameUnknown => 'Inconnu';

  @override
  String get gradingSystemGermanDefault => 'Allemand 1–6';
}
