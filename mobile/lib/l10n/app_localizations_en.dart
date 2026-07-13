// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Bonifatus';

  @override
  String get loginWelcomeBack => 'Welcome back';

  @override
  String get loginSignInSubtitle => 'Sign in to your account';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginEmailValidator => 'Enter a valid email';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginPasswordValidator => 'Enter your password';

  @override
  String get loginForgotPassword => 'Forgot password?';

  @override
  String get loginSignInButton => 'Sign In';

  @override
  String get loginBiometricButton => 'Sign in with Biometrics';

  @override
  String get loginNoAccountPrompt => 'Don\'t have an account? ';

  @override
  String get loginSignUpLink => 'Sign up';

  @override
  String get registerStep1Title => 'What is your name?';

  @override
  String get registerStep1Subtitle => 'This is how you will appear to others.';

  @override
  String get registerFullNameLabel => 'Full name';

  @override
  String get registerContinueButton => 'Continue';

  @override
  String get registerStep2Title => 'I am a...';

  @override
  String get registerStep2Subtitle =>
      'Choose your role to get the right experience.';

  @override
  String get registerRoleStudentTitle => 'Student';

  @override
  String get registerRoleStudentSubtitle => 'Track my grades and earn rewards';

  @override
  String get registerRoleParentTitle => 'Parent';

  @override
  String get registerRoleParentSubtitle =>
      'Set rewards and monitor my child progress';

  @override
  String get registerStep3Title => 'Create your account';

  @override
  String get registerStep3Subtitle => 'Almost there!';

  @override
  String get registerEmailLabel => 'Email';

  @override
  String get registerPasswordLabel => 'Password';

  @override
  String get registerConfirmPasswordLabel => 'Confirm password';

  @override
  String get registerCreateAccountButton => 'Create Account';

  @override
  String get registerAlreadyHaveAccount => 'Already have an account? ';

  @override
  String get registerSignInLink => 'Sign in';

  @override
  String get registerPasswordsDoNotMatch => 'Passwords do not match';

  @override
  String get registerPasswordTooShort =>
      'Password must be at least 12 characters';

  @override
  String get registerFailed => 'Registration failed. Please try again.';

  @override
  String get forgotPasswordAppBarTitle => 'Reset Password';

  @override
  String get forgotPasswordStep1Title => 'Forgot your password?';

  @override
  String get forgotPasswordStep1Subtitle =>
      'Enter your email and we\'ll send you a reset code.';

  @override
  String get forgotPasswordEmailLabel => 'Email';

  @override
  String get forgotPasswordSendCodeButton => 'Send Reset Code';

  @override
  String get forgotPasswordStep2Title => 'Check your email';

  @override
  String forgotPasswordStep2Subtitle(String email) {
    return 'Enter the code we sent to $email.';
  }

  @override
  String get forgotPasswordResetCodeLabel => 'Reset code';

  @override
  String get forgotPasswordNewPasswordLabel => 'New password';

  @override
  String get forgotPasswordResetButton => 'Reset Password';

  @override
  String get forgotPasswordResendCode => 'Resend code';

  @override
  String get forgotPasswordUpdatedSnackbar =>
      'Password updated! Sign in with your new password.';

  @override
  String get verifyEmailAppBarTitle => 'Verify Email';

  @override
  String get verifyEmailTitle => 'Check your email';

  @override
  String verifyEmailSubtitle(String email) {
    return 'Enter the 6-digit code sent to\n$email';
  }

  @override
  String get verifyEmailButton => 'Verify';

  @override
  String get verifyEmailFailed => 'Verification failed. Please try again.';

  @override
  String get onboardingSkip => 'Skip';

  @override
  String get onboardingNext => 'Next';

  @override
  String get onboardingGetStarted => 'Get Started';

  @override
  String get onboardingNoAccountPrompt => 'Don\'t have an account? ';

  @override
  String get onboardingSignUpLink => 'Sign up';

  @override
  String get onboardingPage1Title => 'Turn grades into\nrewards';

  @override
  String get onboardingPage1Body =>
      'Students earn bonus points for every good grade. Parents set the rewards. Everyone wins.';

  @override
  String get onboardingPage2Title => 'Snap a grade,\nearn instantly';

  @override
  String get onboardingPage2Body =>
      'Photo any graded school work. The app reads the subject and grade automatically.';

  @override
  String get onboardingPage3Title => 'Track progress\ntogether';

  @override
  String get onboardingPage3Body =>
      'Parents and students see the same insights — grades, bonuses, and trends over time.';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsSectionPreferences => 'Preferences';

  @override
  String get settingsSectionAccount => 'Account';

  @override
  String get settingsSectionConnectedParents => 'Connected Parents';

  @override
  String get settingsSectionApp => 'App';

  @override
  String get settingsAppearanceLabel => 'Appearance';

  @override
  String get settingsThemeSystem => 'System';

  @override
  String get settingsThemeLight => 'Light';

  @override
  String get settingsThemeDark => 'Dark';

  @override
  String get settingsLanguageLabel => 'Language';

  @override
  String get settingsLanguageAuto => 'Auto';

  @override
  String get settingsLanguageAutoSystem => 'Auto (System)';

  @override
  String get settingsEditProfile => 'Edit Profile';

  @override
  String get settingsChangePassword => 'Change Password';

  @override
  String get settingsChangeEmail => 'Change Email';

  @override
  String get settingsBiometricLogin => 'Biometric Login';

  @override
  String get settingsBiometricVerifyFailed =>
      'Biometric verification failed. Please try again.';

  @override
  String get settingsDeleteAccount => 'Delete Account';

  @override
  String get settingsDeleteAccountDialogTitle => 'Delete Account';

  @override
  String get settingsDeleteAccountDialogContent =>
      'This will permanently delete your account and all data. This action cannot be undone.';

  @override
  String get settingsDeleteAccountConfirm => 'Delete Account';

  @override
  String get settingsCancel => 'Cancel';

  @override
  String get settingsAbout => 'About';

  @override
  String get settingsLogOut => 'Log Out';

  @override
  String get settingsNoParentsConnected => 'No parents connected';

  @override
  String get settingsScanQr => 'Scan QR';

  @override
  String get settingsAddAnotherParent => 'Add another parent';

  @override
  String get settingsScanParentQrTitle => 'Scan Parent QR Code';

  @override
  String get settingsScanQrInstructions =>
      'Point the camera at the QR code shown on the parent device';

  @override
  String settingsConnectedSince(String date) {
    return 'Connected $date';
  }

  @override
  String get settingsRemoveConnection => 'Remove connection';

  @override
  String get settingsParentConnected => 'Parent connected!';

  @override
  String get settingsEditProfileTitle => 'Edit Profile';

  @override
  String get settingsFullName => 'Full Name';

  @override
  String get settingsNameCannotBeEmpty => 'Name cannot be empty';

  @override
  String get settingsProfileUpdated => 'Profile updated';

  @override
  String get settingsChangePasswordTitle => 'Change Password';

  @override
  String get settingsNewPassword => 'New Password';

  @override
  String get settingsConfirmPassword => 'Confirm Password';

  @override
  String get settingsEnterPassword => 'Enter a password';

  @override
  String get settingsMin12Chars => 'Minimum 12 characters';

  @override
  String get settingsPasswordsDoNotMatch => 'Passwords do not match';

  @override
  String get settingsPasswordChanged => 'Password changed';

  @override
  String get settingsChangeEmailTitle => 'Change Email';

  @override
  String get settingsNewEmailAddress => 'New Email Address';

  @override
  String get settingsEnterEmail => 'Enter an email';

  @override
  String get settingsEnterValidEmail => 'Enter a valid email';

  @override
  String get settingsSendVerificationCode => 'Send Verification Code';

  @override
  String get settingsSending => 'Sending…';

  @override
  String settingsCodeSentTo(String email) {
    return 'We sent a 6-digit code to $email.';
  }

  @override
  String get settingsVerificationCode => 'Verification Code';

  @override
  String get settingsEnter6DigitCode => 'Enter the 6-digit code';

  @override
  String get settingsEmailUpdated => 'Email updated';

  @override
  String get settingsInvalidCode =>
      'Invalid or expired code. Please try again.';

  @override
  String get settingsSave => 'Save';

  @override
  String settingsDeleteAccountFailed(String error) {
    return 'Failed to delete account: $error';
  }

  @override
  String get settingsAboutLegalese => 'Grade rewards tracker for students';

  @override
  String get settingsAboutAppName => 'Bonifatus';

  @override
  String get settingsGradingConfig => 'Grading Config';

  @override
  String get settingsGradingConfigSubtitle =>
      'Tier multipliers · notes cycle · bonus ratio';

  @override
  String get settingsGradeTierMultipliers => 'Grade Tier Multipliers';

  @override
  String get settingsOngoingNotesCycle => 'Ongoing Notes Cycle';

  @override
  String settingsEditMultiplier(String label) {
    return 'Edit Multiplier: $label';
  }

  @override
  String settingsConfigFor(String childName) {
    return 'Config for $childName';
  }

  @override
  String get settingsCycleType => 'Cycle Type';

  @override
  String get settingsBonusRatio => 'Bonus Ratio';

  @override
  String get settingsTierBestLabel => 'Best (Grade 1–2)';

  @override
  String get settingsTierSecondLabel => 'Second (Grade 3)';

  @override
  String get settingsTierThirdLabel => 'Third (Grade 4)';

  @override
  String get settingsFailedToLoadChildren => 'Failed to load children';

  @override
  String get settingsNoChildrenConnected => 'No children connected';

  @override
  String dashboardHiName(String name) {
    return 'Hi $name 👋';
  }

  @override
  String get dashboardSubtitle => 'Track your grades, earn rewards';

  @override
  String get dashboardThisWeek => 'This Week';

  @override
  String get dashboardRecentNotes => 'Recent Notes';

  @override
  String get dashboardSavedResults => 'Saved Results';

  @override
  String get dashboardQuickCalculate => 'Quick Calculate';

  @override
  String get dashboardCouldNotLoadNotes => 'Could not load notes';

  @override
  String get dashboardNoNotesYet => 'No notes yet';

  @override
  String get dashboardCouldNotLoadResults => 'Could not load results';

  @override
  String get dashboardNoSavedResultsYet => 'No saved results yet';

  @override
  String get calculatorTitle => 'Grade Calculator';

  @override
  String get calculatorGradingSystem => 'Grading System';

  @override
  String get calculatorClass => 'Class';

  @override
  String get calculatorTerm => 'Term';

  @override
  String get calculatorSchoolYear => 'School Year';

  @override
  String get calculatorLabelOptional => 'Label (optional)';

  @override
  String get calculatorGradePlanner => 'Grade Planner';

  @override
  String get calculatorGradePlannerHint =>
      'Set your class and term above, then tap \"Add Subject\" to enter grades and see your bonus.';

  @override
  String get calculatorAddSubject => 'Add Subject';

  @override
  String get calculatorSearchSubjects => 'Search subjects…';

  @override
  String get calculatorGradeLabel => 'Grade';

  @override
  String get calculatorWeightLabel => 'Weight';

  @override
  String get calculatorWeightTooltip =>
      'Higher weight = more bonus. Use 2× for harder exams.';

  @override
  String get calculatorSelectSubjectValidator => 'Please select a subject';

  @override
  String get calculatorSelectGradeValidator => 'Please select a grade';

  @override
  String get calculatorCoreSubjects => 'Core Subjects';

  @override
  String get calculatorOther => 'Other';

  @override
  String get calculatorTotalBonus => 'Total Bonus';

  @override
  String get calculatorSaveResult => 'Save Result';

  @override
  String get calculatorResultSaved => 'Result saved!';

  @override
  String get calculatorSaveChanges => 'Save Changes';

  @override
  String get calculatorTierExcellent => 'Excellent';

  @override
  String get calculatorTierGood => 'Good';

  @override
  String get calculatorTierSatisfactory => 'Satisfactory';

  @override
  String get calculatorTierBelow => 'Below threshold';

  @override
  String get calculatorSettingsTooltip => 'Settings';

  @override
  String get notesTitle => 'Notes';

  @override
  String get notesNoNotesYet => 'No notes yet';

  @override
  String get notesTapToCaptureFirst => 'Tap + to capture your first grade';

  @override
  String get notesFailedToLoad => 'Failed to load notes';

  @override
  String get notesRetry => 'Retry';

  @override
  String get notesViewCycleSummary => 'View Cycle Summary';

  @override
  String get notesDeleteGradeTitle => 'Delete Grade';

  @override
  String get notesDeleteGradeConfirm =>
      'Are you sure you want to delete this grade?';

  @override
  String get notesDelete => 'Delete';

  @override
  String get notesCancel => 'Cancel';

  @override
  String get notesThisWeek => 'This Week';

  @override
  String get notesLastWeek => 'Last Week';

  @override
  String get noteDetailTitle => 'Note Detail';

  @override
  String get noteDetailCouldNotLoad => 'Could not load note';

  @override
  String get noteDetailNotFound => 'Grade not found';

  @override
  String get noteDetailDateCaptured => 'Date Captured';

  @override
  String get noteDetailQualityTier => 'Quality Tier';

  @override
  String get noteDetailSettlement => 'Settlement';

  @override
  String get noteDetailSettled => 'Settled';

  @override
  String get noteDetailPending => 'Pending';

  @override
  String get noteDetailTier1 => 'Tier 1 — Excellent';

  @override
  String get noteDetailTier2 => 'Tier 2 — Good';

  @override
  String get noteDetailTier3 => 'Tier 3 — Satisfactory';

  @override
  String get noteDetailTierBelow => 'Below Threshold';

  @override
  String get noteDetailDeleteTitle => 'Delete Note';

  @override
  String get noteDetailDeleteConfirm =>
      'Are you sure you want to delete this note? This action cannot be undone.';

  @override
  String get noteDetailDelete => 'Delete';

  @override
  String get noteDetailCancel => 'Cancel';

  @override
  String get captureTitle => 'Capture Grade';

  @override
  String get capturePositionGrade =>
      'Position the grade so it is clearly visible';

  @override
  String get captureChooseFromGallery => 'Choose from Gallery';

  @override
  String get captureTakePhoto => 'Take Photo';

  @override
  String get captureLoadingEntry => 'Loading grade entry...';

  @override
  String get captureEnterGrade => 'Enter Grade';

  @override
  String get captureSelectSubjectGrade => 'Select the subject and grade value';

  @override
  String get captureSubjectLabel => 'Subject';

  @override
  String get captureGradeLabel => 'Grade';

  @override
  String get captureNoSubjectsLoaded => 'No subjects loaded';

  @override
  String get captureSelectSubjectAndGrade =>
      'Please select a subject and grade';

  @override
  String get captureSaveGrade => 'Save Grade';

  @override
  String get captureCancel => 'Cancel';

  @override
  String get cycleSummaryTitle => 'Cycle Summary';

  @override
  String get cycleSummaryCouldNotLoad => 'Could not load grades';

  @override
  String get cycleSummaryWeekly => 'Weekly';

  @override
  String get cycleSummaryNotesInCycle => 'Notes in this Cycle';

  @override
  String get cycleSummaryNoGrades => 'No grades in this period';

  @override
  String get cycleSummaryPositive => 'Positive';

  @override
  String get cycleSummaryNet => 'Net';

  @override
  String get resultsTitle => 'Saved Results';

  @override
  String get resultsFailedToLoad => 'Failed to load results';

  @override
  String get resultsRetry => 'Retry';

  @override
  String get resultsNoResults => 'No saved results yet';

  @override
  String get resultsUseCalculator =>
      'Use the calculator to save your first term result.';

  @override
  String get resultsOpenCalculator => 'Open Calculator';

  @override
  String get termDetailTitle => 'Term Result';

  @override
  String get termDetailCouldNotLoad => 'Could not load term';

  @override
  String get termDetailNotFound => 'Term not found';

  @override
  String get termDetailAverage => 'Average';

  @override
  String get termDetailBonus => 'Bonus';

  @override
  String get termDetailSubjects => 'Subjects';

  @override
  String get termDetailSubjectBreakdown => 'Subject Breakdown';

  @override
  String get insightsTitle => 'Insights';

  @override
  String get insightsFailedToLoad => 'Failed to load insights';

  @override
  String get insightsRetry => 'Retry';

  @override
  String get insightsNoGradesYet => 'No grades yet';

  @override
  String get insightsAddGradesHint =>
      'Add grades in the Notes tab to see insights.';

  @override
  String get insightsBonusPointsLastMonths => 'Bonus Points — Last 6 Months';

  @override
  String get insightsNoBonusPoints => 'No bonus points in the last 6 months';

  @override
  String get insightsGradeDistribution => 'Grade Distribution';

  @override
  String get insightsThisWeek => 'This Week';

  @override
  String get insightsAllTime => 'All Time';

  @override
  String get insightsGrades => 'Grades';

  @override
  String get insightsEarned => 'Earned';

  @override
  String get insightsUnsettled => 'Unsettled';

  @override
  String get insightsTotalPts => 'Total Pts';

  @override
  String get insightsPending => 'Pending';

  @override
  String get insightsTierBest => 'Best (1–1.4)';

  @override
  String get insightsTierGood => 'Good (1.5–2.4)';

  @override
  String get insightsTierOk => 'OK (2.5–3.4)';

  @override
  String get insightsTierBelow => 'Below (3.5+)';

  @override
  String parentDashboardHiName(String name) {
    return 'Hi $name';
  }

  @override
  String get parentDashboardOverview => 'Overview of your children';

  @override
  String get parentDashboardSummary => 'Summary';

  @override
  String get parentDashboardChildren => 'Children';

  @override
  String get parentDashboardPending => 'Pending';

  @override
  String get parentDashboardGrades => 'Grades';

  @override
  String get parentDashboardChildrenOverview => 'Children Overview';

  @override
  String get parentDashboardNoChildrenConnected =>
      'No children connected yet.\nGo to Children tab to add one.';

  @override
  String get parentDashboardRecentGrade => 'Recent grade';

  @override
  String get parentDashboardCouldNotLoadChildren =>
      'Could not load children data';

  @override
  String get childrenTitle => 'Children';

  @override
  String get childrenNoChildrenConnected => 'No children connected';

  @override
  String get childrenShareQrHint =>
      'Share an invite QR code to connect with a student';

  @override
  String get childrenShowInviteQr => 'Show Invite QR';

  @override
  String get childrenInviteStudent => 'Invite a Student';

  @override
  String get childrenScanCodeHint =>
      'Ask the student to scan this code in their app';

  @override
  String get childrenFailedToCreateInvite => 'Failed to create invite';

  @override
  String get childrenRetry => 'Retry';

  @override
  String get childrenClose => 'Close';

  @override
  String get childrenFailedToLoad => 'Failed to load children';

  @override
  String get childDetailTitle => 'Child Detail';

  @override
  String get childDetailCouldNotLoad => 'Could not load data';

  @override
  String get childDetailNotFound => 'Child not found';

  @override
  String get childDetailTermResults => 'Term Results';

  @override
  String get childDetailNoTermResults => 'No term results saved yet.';

  @override
  String get childDetailCouldNotLoadTermResults =>
      'Could not load term results';

  @override
  String get childDetailQuickGrades => 'Quick Grades';

  @override
  String get childDetailNoQuickGrades => 'No quick grades yet';

  @override
  String get childDetailGrades => 'Grades';

  @override
  String get childDetailTotalPts => 'Total Pts';

  @override
  String get childDetailPending => 'Pending';

  @override
  String get childDetailSettled => 'Settled';

  @override
  String get childDetailBonus => 'Bonus';

  @override
  String get childDetailStatus => 'Status';

  @override
  String get rewardsTitle => 'Rewards';

  @override
  String get rewardsTabQuickGrades => 'Quick Grades';

  @override
  String get rewardsTabSummary => 'Summary';

  @override
  String get rewardsNoChildrenConnected => 'No children connected';

  @override
  String get rewardsFailedToLoadData => 'Failed to load rewards data';

  @override
  String get rewardsRetry => 'Retry';

  @override
  String get rewardsNoPendingGrades => 'No pending grades';

  @override
  String get rewardsSettle => 'Settle';

  @override
  String rewardsSettleBonusFor(String childName) {
    return 'Settle Bonus for $childName';
  }

  @override
  String get rewardsAmountToTransfer => 'Amount to transfer';

  @override
  String get rewardsCancel => 'Cancel';

  @override
  String get rewardsConfirmSettle => 'Confirm Settle';

  @override
  String get rewardsSettled => 'Settled!';

  @override
  String get parentInsightsTitle => 'Insights';

  @override
  String get parentInsightsFailedToLoad => 'Failed to load insights';

  @override
  String get parentInsightsRetry => 'Retry';

  @override
  String get parentInsightsNoInsights => 'No insights yet';

  @override
  String get parentInsightsNoInsightsHint =>
      'Connect children to see their grade insights';

  @override
  String get parentInsightsAllChildrenSummary => 'All Children — Summary';

  @override
  String get parentInsightsTotalEarned => 'Total Earned';

  @override
  String get parentInsightsPending => 'Pending';

  @override
  String get parentInsightsChildren => 'Children';

  @override
  String get navHome => 'Home';

  @override
  String get navCalculator => 'Calculator';

  @override
  String parentDashboardChildSubtitle(int count, int pts) {
    return '$count grades · $pts pts pending';
  }

  @override
  String get termDetailDeleteTitle => 'Delete Result';

  @override
  String get termDetailDeleteConfirm =>
      'Are you sure you want to delete this result? This action cannot be undone.';

  @override
  String get termDetailDelete => 'Delete';

  @override
  String get termDetailEditLabel => 'Edit Label';

  @override
  String get calculatorLabelHint => 'e.g. Final exam';

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
    return 'No subjects match \"$query\"';
  }

  @override
  String get calculatorRemoveSubject => 'Remove';

  @override
  String calculatorFailedToSave(String error) {
    return 'Failed to save: $error';
  }

  @override
  String calculatorSubjectsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count subjects',
      one: '$count subject',
    );
    return '$_temp0';
  }

  @override
  String calculatorGradeHint(String example) {
    return 'e.g. $example';
  }

  @override
  String childrenGradesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count grades',
      one: '$count grade',
    );
    return '$_temp0';
  }

  @override
  String get childrenView => 'View';

  @override
  String childrenPtsPending(int pts) {
    return '$pts pts pending';
  }

  @override
  String rewardsSummarySubtitle(int count, int pts) {
    return '$count grades · $pts pts total';
  }

  @override
  String get subjectFallback => 'Subject';

  @override
  String genericFailedError(String error) {
    return 'Error: $error';
  }

  @override
  String forgotPasswordCooldownMessage(int seconds) {
    return 'Please wait $seconds seconds before requesting another code.';
  }

  @override
  String get cycleTypeDaily => 'Daily';

  @override
  String get cycleTypeWeekly => 'Weekly';

  @override
  String get cycleTypeMonthly => 'Monthly';

  @override
  String notesNetPointsLabel(String pts) {
    return 'Net: $pts pts';
  }

  @override
  String childrenInviteCode(String code) {
    return 'Code: $code';
  }

  @override
  String get ptsAbbr => 'pts';

  @override
  String get bonusPtsLabel => 'bonus pts';

  @override
  String get totalGradesLabel => 'total grades';

  @override
  String get classLabel => 'Class';

  @override
  String get ratioLabel => 'ratio';

  @override
  String get genericRequestFailed => 'Request failed';

  @override
  String get parentFallback => 'Parent';

  @override
  String get calculatorSchoolYearHint => '2024/25';

  @override
  String get registerDateOfBirthLabel => 'Date of Birth';

  @override
  String get registerDateOfBirthHint => 'Select date of birth';

  @override
  String get registerDateOfBirthRequired => 'Please select your date of birth';

  @override
  String get captureClassLevelLabel => 'Class Level';
}
