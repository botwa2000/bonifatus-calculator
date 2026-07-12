import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_it.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('it'),
    Locale('ru'),
  ];

  /// No description provided for @loginWelcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginWelcomeBack;

  /// No description provided for @loginSignInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your account'**
  String get loginSignInSubtitle;

  /// No description provided for @loginEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get loginEmailLabel;

  /// No description provided for @loginEmailValidator.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get loginEmailValidator;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get loginPasswordLabel;

  /// No description provided for @loginPasswordValidator.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get loginPasswordValidator;

  /// No description provided for @loginForgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get loginForgotPassword;

  /// No description provided for @loginSignInButton.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get loginSignInButton;

  /// No description provided for @loginBiometricButton.
  ///
  /// In en, this message translates to:
  /// **'Sign in with Biometrics'**
  String get loginBiometricButton;

  /// No description provided for @loginNoAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get loginNoAccountPrompt;

  /// No description provided for @loginSignUpLink.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get loginSignUpLink;

  /// No description provided for @registerStep1Title.
  ///
  /// In en, this message translates to:
  /// **'What is your name?'**
  String get registerStep1Title;

  /// No description provided for @registerStep1Subtitle.
  ///
  /// In en, this message translates to:
  /// **'This is how you will appear to others.'**
  String get registerStep1Subtitle;

  /// No description provided for @registerFullNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get registerFullNameLabel;

  /// No description provided for @registerContinueButton.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get registerContinueButton;

  /// No description provided for @registerStep2Title.
  ///
  /// In en, this message translates to:
  /// **'I am a...'**
  String get registerStep2Title;

  /// No description provided for @registerStep2Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose your role to get the right experience.'**
  String get registerStep2Subtitle;

  /// No description provided for @registerRoleStudentTitle.
  ///
  /// In en, this message translates to:
  /// **'Student'**
  String get registerRoleStudentTitle;

  /// No description provided for @registerRoleStudentSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Track my grades and earn rewards'**
  String get registerRoleStudentSubtitle;

  /// No description provided for @registerRoleParentTitle.
  ///
  /// In en, this message translates to:
  /// **'Parent'**
  String get registerRoleParentTitle;

  /// No description provided for @registerRoleParentSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Set rewards and monitor my child progress'**
  String get registerRoleParentSubtitle;

  /// No description provided for @registerStep3Title.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get registerStep3Title;

  /// No description provided for @registerStep3Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Almost there!'**
  String get registerStep3Subtitle;

  /// No description provided for @registerEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get registerEmailLabel;

  /// No description provided for @registerPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get registerPasswordLabel;

  /// No description provided for @registerConfirmPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get registerConfirmPasswordLabel;

  /// No description provided for @registerCreateAccountButton.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get registerCreateAccountButton;

  /// No description provided for @registerAlreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? '**
  String get registerAlreadyHaveAccount;

  /// No description provided for @registerSignInLink.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get registerSignInLink;

  /// No description provided for @registerPasswordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get registerPasswordsDoNotMatch;

  /// No description provided for @registerPasswordTooShort.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 12 characters'**
  String get registerPasswordTooShort;

  /// No description provided for @registerFailed.
  ///
  /// In en, this message translates to:
  /// **'Registration failed. Please try again.'**
  String get registerFailed;

  /// No description provided for @forgotPasswordAppBarTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get forgotPasswordAppBarTitle;

  /// No description provided for @forgotPasswordStep1Title.
  ///
  /// In en, this message translates to:
  /// **'Forgot your password?'**
  String get forgotPasswordStep1Title;

  /// No description provided for @forgotPasswordStep1Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your email and we\'ll send you a reset code.'**
  String get forgotPasswordStep1Subtitle;

  /// No description provided for @forgotPasswordEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get forgotPasswordEmailLabel;

  /// No description provided for @forgotPasswordSendCodeButton.
  ///
  /// In en, this message translates to:
  /// **'Send Reset Code'**
  String get forgotPasswordSendCodeButton;

  /// No description provided for @forgotPasswordStep2Title.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get forgotPasswordStep2Title;

  /// No description provided for @forgotPasswordStep2Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the code we sent to {email}.'**
  String forgotPasswordStep2Subtitle(String email);

  /// No description provided for @forgotPasswordResetCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Reset code'**
  String get forgotPasswordResetCodeLabel;

  /// No description provided for @forgotPasswordNewPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get forgotPasswordNewPasswordLabel;

  /// No description provided for @forgotPasswordResetButton.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get forgotPasswordResetButton;

  /// No description provided for @forgotPasswordResendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get forgotPasswordResendCode;

  /// No description provided for @forgotPasswordUpdatedSnackbar.
  ///
  /// In en, this message translates to:
  /// **'Password updated! Sign in with your new password.'**
  String get forgotPasswordUpdatedSnackbar;

  /// No description provided for @verifyEmailAppBarTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify Email'**
  String get verifyEmailAppBarTitle;

  /// No description provided for @verifyEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get verifyEmailTitle;

  /// No description provided for @verifyEmailSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to\n{email}'**
  String verifyEmailSubtitle(String email);

  /// No description provided for @verifyEmailButton.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get verifyEmailButton;

  /// No description provided for @verifyEmailFailed.
  ///
  /// In en, this message translates to:
  /// **'Verification failed. Please try again.'**
  String get verifyEmailFailed;

  /// No description provided for @onboardingSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get onboardingSkip;

  /// No description provided for @onboardingNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get onboardingNext;

  /// No description provided for @onboardingGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get onboardingGetStarted;

  /// No description provided for @onboardingNoAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get onboardingNoAccountPrompt;

  /// No description provided for @onboardingSignUpLink.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get onboardingSignUpLink;

  /// No description provided for @onboardingPage1Title.
  ///
  /// In en, this message translates to:
  /// **'Turn grades into\nrewards'**
  String get onboardingPage1Title;

  /// No description provided for @onboardingPage1Body.
  ///
  /// In en, this message translates to:
  /// **'Students earn bonus points for every good grade. Parents set the rewards. Everyone wins.'**
  String get onboardingPage1Body;

  /// No description provided for @onboardingPage2Title.
  ///
  /// In en, this message translates to:
  /// **'Snap a grade,\nearn instantly'**
  String get onboardingPage2Title;

  /// No description provided for @onboardingPage2Body.
  ///
  /// In en, this message translates to:
  /// **'Photo any graded school work. The app reads the subject and grade automatically.'**
  String get onboardingPage2Body;

  /// No description provided for @onboardingPage3Title.
  ///
  /// In en, this message translates to:
  /// **'Track progress\ntogether'**
  String get onboardingPage3Title;

  /// No description provided for @onboardingPage3Body.
  ///
  /// In en, this message translates to:
  /// **'Parents and students see the same insights — grades, bonuses, and trends over time.'**
  String get onboardingPage3Body;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @settingsSectionPreferences.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get settingsSectionPreferences;

  /// No description provided for @settingsSectionAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get settingsSectionAccount;

  /// No description provided for @settingsSectionConnectedParents.
  ///
  /// In en, this message translates to:
  /// **'Connected Parents'**
  String get settingsSectionConnectedParents;

  /// No description provided for @settingsSectionApp.
  ///
  /// In en, this message translates to:
  /// **'App'**
  String get settingsSectionApp;

  /// No description provided for @settingsAppearanceLabel.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get settingsAppearanceLabel;

  /// No description provided for @settingsThemeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get settingsThemeSystem;

  /// No description provided for @settingsThemeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get settingsThemeLight;

  /// No description provided for @settingsThemeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get settingsThemeDark;

  /// No description provided for @settingsLanguageLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguageLabel;

  /// No description provided for @settingsLanguageAuto.
  ///
  /// In en, this message translates to:
  /// **'Auto'**
  String get settingsLanguageAuto;

  /// No description provided for @settingsLanguageAutoSystem.
  ///
  /// In en, this message translates to:
  /// **'Auto (System)'**
  String get settingsLanguageAutoSystem;

  /// No description provided for @settingsEditProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get settingsEditProfile;

  /// No description provided for @settingsChangePassword.
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get settingsChangePassword;

  /// No description provided for @settingsChangeEmail.
  ///
  /// In en, this message translates to:
  /// **'Change Email'**
  String get settingsChangeEmail;

  /// No description provided for @settingsBiometricLogin.
  ///
  /// In en, this message translates to:
  /// **'Biometric Login'**
  String get settingsBiometricLogin;

  /// No description provided for @settingsBiometricVerifyFailed.
  ///
  /// In en, this message translates to:
  /// **'Biometric verification failed. Please try again.'**
  String get settingsBiometricVerifyFailed;

  /// No description provided for @settingsDeleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get settingsDeleteAccount;

  /// No description provided for @settingsDeleteAccountDialogTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get settingsDeleteAccountDialogTitle;

  /// No description provided for @settingsDeleteAccountDialogContent.
  ///
  /// In en, this message translates to:
  /// **'This will permanently delete your account and all data. This action cannot be undone.'**
  String get settingsDeleteAccountDialogContent;

  /// No description provided for @settingsDeleteAccountConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get settingsDeleteAccountConfirm;

  /// No description provided for @settingsCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get settingsCancel;

  /// No description provided for @settingsAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get settingsAbout;

  /// No description provided for @settingsLogOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get settingsLogOut;

  /// No description provided for @settingsNoParentsConnected.
  ///
  /// In en, this message translates to:
  /// **'No parents connected'**
  String get settingsNoParentsConnected;

  /// No description provided for @settingsScanQr.
  ///
  /// In en, this message translates to:
  /// **'Scan QR'**
  String get settingsScanQr;

  /// No description provided for @settingsAddAnotherParent.
  ///
  /// In en, this message translates to:
  /// **'Add another parent'**
  String get settingsAddAnotherParent;

  /// No description provided for @settingsScanParentQrTitle.
  ///
  /// In en, this message translates to:
  /// **'Scan Parent QR Code'**
  String get settingsScanParentQrTitle;

  /// No description provided for @settingsScanQrInstructions.
  ///
  /// In en, this message translates to:
  /// **'Point the camera at the QR code shown on the parent device'**
  String get settingsScanQrInstructions;

  /// No description provided for @settingsConnectedSince.
  ///
  /// In en, this message translates to:
  /// **'Connected {date}'**
  String settingsConnectedSince(String date);

  /// No description provided for @settingsRemoveConnection.
  ///
  /// In en, this message translates to:
  /// **'Remove connection'**
  String get settingsRemoveConnection;

  /// No description provided for @settingsParentConnected.
  ///
  /// In en, this message translates to:
  /// **'Parent connected!'**
  String get settingsParentConnected;

  /// No description provided for @settingsEditProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get settingsEditProfileTitle;

  /// No description provided for @settingsFullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get settingsFullName;

  /// No description provided for @settingsNameCannotBeEmpty.
  ///
  /// In en, this message translates to:
  /// **'Name cannot be empty'**
  String get settingsNameCannotBeEmpty;

  /// No description provided for @settingsProfileUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile updated'**
  String get settingsProfileUpdated;

  /// No description provided for @settingsChangePasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get settingsChangePasswordTitle;

  /// No description provided for @settingsNewPassword.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get settingsNewPassword;

  /// No description provided for @settingsConfirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get settingsConfirmPassword;

  /// No description provided for @settingsEnterPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter a password'**
  String get settingsEnterPassword;

  /// No description provided for @settingsMin12Chars.
  ///
  /// In en, this message translates to:
  /// **'Minimum 12 characters'**
  String get settingsMin12Chars;

  /// No description provided for @settingsPasswordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get settingsPasswordsDoNotMatch;

  /// No description provided for @settingsPasswordChanged.
  ///
  /// In en, this message translates to:
  /// **'Password changed'**
  String get settingsPasswordChanged;

  /// No description provided for @settingsChangeEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Change Email'**
  String get settingsChangeEmailTitle;

  /// No description provided for @settingsNewEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'New Email Address'**
  String get settingsNewEmailAddress;

  /// No description provided for @settingsEnterEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter an email'**
  String get settingsEnterEmail;

  /// No description provided for @settingsEnterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get settingsEnterValidEmail;

  /// No description provided for @settingsSendVerificationCode.
  ///
  /// In en, this message translates to:
  /// **'Send Verification Code'**
  String get settingsSendVerificationCode;

  /// No description provided for @settingsSending.
  ///
  /// In en, this message translates to:
  /// **'Sending…'**
  String get settingsSending;

  /// No description provided for @settingsCodeSentTo.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to {email}.'**
  String settingsCodeSentTo(String email);

  /// No description provided for @settingsVerificationCode.
  ///
  /// In en, this message translates to:
  /// **'Verification Code'**
  String get settingsVerificationCode;

  /// No description provided for @settingsEnter6DigitCode.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code'**
  String get settingsEnter6DigitCode;

  /// No description provided for @settingsEmailUpdated.
  ///
  /// In en, this message translates to:
  /// **'Email updated'**
  String get settingsEmailUpdated;

  /// No description provided for @settingsInvalidCode.
  ///
  /// In en, this message translates to:
  /// **'Invalid or expired code. Please try again.'**
  String get settingsInvalidCode;

  /// No description provided for @settingsSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get settingsSave;

  /// No description provided for @settingsDeleteAccountFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to delete account: {error}'**
  String settingsDeleteAccountFailed(String error);

  /// No description provided for @settingsAboutLegalese.
  ///
  /// In en, this message translates to:
  /// **'Grade rewards tracker for students'**
  String get settingsAboutLegalese;

  /// No description provided for @settingsAboutAppName.
  ///
  /// In en, this message translates to:
  /// **'Bonifatus'**
  String get settingsAboutAppName;

  /// No description provided for @settingsGradingConfig.
  ///
  /// In en, this message translates to:
  /// **'Grading Config'**
  String get settingsGradingConfig;

  /// No description provided for @settingsGradingConfigSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Tier multipliers · notes cycle · bonus ratio'**
  String get settingsGradingConfigSubtitle;

  /// No description provided for @settingsGradeTierMultipliers.
  ///
  /// In en, this message translates to:
  /// **'Grade Tier Multipliers'**
  String get settingsGradeTierMultipliers;

  /// No description provided for @settingsOngoingNotesCycle.
  ///
  /// In en, this message translates to:
  /// **'Ongoing Notes Cycle'**
  String get settingsOngoingNotesCycle;

  /// No description provided for @settingsEditMultiplier.
  ///
  /// In en, this message translates to:
  /// **'Edit Multiplier: {label}'**
  String settingsEditMultiplier(String label);

  /// No description provided for @settingsConfigFor.
  ///
  /// In en, this message translates to:
  /// **'Config for {childName}'**
  String settingsConfigFor(String childName);

  /// No description provided for @settingsCycleType.
  ///
  /// In en, this message translates to:
  /// **'Cycle Type'**
  String get settingsCycleType;

  /// No description provided for @settingsBonusRatio.
  ///
  /// In en, this message translates to:
  /// **'Bonus Ratio'**
  String get settingsBonusRatio;

  /// No description provided for @settingsTierBestLabel.
  ///
  /// In en, this message translates to:
  /// **'Best (Grade 1–2)'**
  String get settingsTierBestLabel;

  /// No description provided for @settingsTierSecondLabel.
  ///
  /// In en, this message translates to:
  /// **'Second (Grade 3)'**
  String get settingsTierSecondLabel;

  /// No description provided for @settingsTierThirdLabel.
  ///
  /// In en, this message translates to:
  /// **'Third (Grade 4)'**
  String get settingsTierThirdLabel;

  /// No description provided for @settingsFailedToLoadChildren.
  ///
  /// In en, this message translates to:
  /// **'Failed to load children'**
  String get settingsFailedToLoadChildren;

  /// No description provided for @settingsNoChildrenConnected.
  ///
  /// In en, this message translates to:
  /// **'No children connected'**
  String get settingsNoChildrenConnected;

  /// No description provided for @dashboardHiName.
  ///
  /// In en, this message translates to:
  /// **'Hi {name} 👋'**
  String dashboardHiName(String name);

  /// No description provided for @dashboardSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Track your grades, earn rewards'**
  String get dashboardSubtitle;

  /// No description provided for @dashboardThisWeek.
  ///
  /// In en, this message translates to:
  /// **'This Week'**
  String get dashboardThisWeek;

  /// No description provided for @dashboardRecentNotes.
  ///
  /// In en, this message translates to:
  /// **'Recent Notes'**
  String get dashboardRecentNotes;

  /// No description provided for @dashboardSavedResults.
  ///
  /// In en, this message translates to:
  /// **'Saved Results'**
  String get dashboardSavedResults;

  /// No description provided for @dashboardQuickCalculate.
  ///
  /// In en, this message translates to:
  /// **'Quick Calculate'**
  String get dashboardQuickCalculate;

  /// No description provided for @dashboardCouldNotLoadNotes.
  ///
  /// In en, this message translates to:
  /// **'Could not load notes'**
  String get dashboardCouldNotLoadNotes;

  /// No description provided for @dashboardNoNotesYet.
  ///
  /// In en, this message translates to:
  /// **'No notes yet'**
  String get dashboardNoNotesYet;

  /// No description provided for @dashboardCouldNotLoadResults.
  ///
  /// In en, this message translates to:
  /// **'Could not load results'**
  String get dashboardCouldNotLoadResults;

  /// No description provided for @dashboardNoSavedResultsYet.
  ///
  /// In en, this message translates to:
  /// **'No saved results yet'**
  String get dashboardNoSavedResultsYet;

  /// No description provided for @calculatorTitle.
  ///
  /// In en, this message translates to:
  /// **'Grade Calculator'**
  String get calculatorTitle;

  /// No description provided for @calculatorGradingSystem.
  ///
  /// In en, this message translates to:
  /// **'Grading System'**
  String get calculatorGradingSystem;

  /// No description provided for @calculatorClass.
  ///
  /// In en, this message translates to:
  /// **'Class'**
  String get calculatorClass;

  /// No description provided for @calculatorTerm.
  ///
  /// In en, this message translates to:
  /// **'Term'**
  String get calculatorTerm;

  /// No description provided for @calculatorSchoolYear.
  ///
  /// In en, this message translates to:
  /// **'School Year'**
  String get calculatorSchoolYear;

  /// No description provided for @calculatorLabelOptional.
  ///
  /// In en, this message translates to:
  /// **'Label (optional)'**
  String get calculatorLabelOptional;

  /// No description provided for @calculatorGradePlanner.
  ///
  /// In en, this message translates to:
  /// **'Grade Planner'**
  String get calculatorGradePlanner;

  /// No description provided for @calculatorGradePlannerHint.
  ///
  /// In en, this message translates to:
  /// **'Set your class and term above, then tap \"Add Subject\" to enter grades and see your bonus.'**
  String get calculatorGradePlannerHint;

  /// No description provided for @calculatorAddSubject.
  ///
  /// In en, this message translates to:
  /// **'Add Subject'**
  String get calculatorAddSubject;

  /// No description provided for @calculatorSearchSubjects.
  ///
  /// In en, this message translates to:
  /// **'Search subjects…'**
  String get calculatorSearchSubjects;

  /// No description provided for @calculatorGradeLabel.
  ///
  /// In en, this message translates to:
  /// **'Grade'**
  String get calculatorGradeLabel;

  /// No description provided for @calculatorWeightLabel.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get calculatorWeightLabel;

  /// No description provided for @calculatorWeightTooltip.
  ///
  /// In en, this message translates to:
  /// **'Higher weight = more bonus. Use 2× for harder exams.'**
  String get calculatorWeightTooltip;

  /// No description provided for @calculatorSelectSubjectValidator.
  ///
  /// In en, this message translates to:
  /// **'Please select a subject'**
  String get calculatorSelectSubjectValidator;

  /// No description provided for @calculatorSelectGradeValidator.
  ///
  /// In en, this message translates to:
  /// **'Please select a grade'**
  String get calculatorSelectGradeValidator;

  /// No description provided for @calculatorCoreSubjects.
  ///
  /// In en, this message translates to:
  /// **'Core Subjects'**
  String get calculatorCoreSubjects;

  /// No description provided for @calculatorOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get calculatorOther;

  /// No description provided for @calculatorTotalBonus.
  ///
  /// In en, this message translates to:
  /// **'Total Bonus'**
  String get calculatorTotalBonus;

  /// No description provided for @calculatorSaveResult.
  ///
  /// In en, this message translates to:
  /// **'Save Result'**
  String get calculatorSaveResult;

  /// No description provided for @calculatorResultSaved.
  ///
  /// In en, this message translates to:
  /// **'Result saved!'**
  String get calculatorResultSaved;

  /// No description provided for @calculatorSaveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get calculatorSaveChanges;

  /// No description provided for @calculatorTierExcellent.
  ///
  /// In en, this message translates to:
  /// **'Excellent'**
  String get calculatorTierExcellent;

  /// No description provided for @calculatorTierGood.
  ///
  /// In en, this message translates to:
  /// **'Good'**
  String get calculatorTierGood;

  /// No description provided for @calculatorTierSatisfactory.
  ///
  /// In en, this message translates to:
  /// **'Satisfactory'**
  String get calculatorTierSatisfactory;

  /// No description provided for @calculatorTierBelow.
  ///
  /// In en, this message translates to:
  /// **'Below threshold'**
  String get calculatorTierBelow;

  /// No description provided for @calculatorSettingsTooltip.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get calculatorSettingsTooltip;

  /// No description provided for @notesTitle.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notesTitle;

  /// No description provided for @notesNoNotesYet.
  ///
  /// In en, this message translates to:
  /// **'No notes yet'**
  String get notesNoNotesYet;

  /// No description provided for @notesTapToCaptureFirst.
  ///
  /// In en, this message translates to:
  /// **'Tap + to capture your first grade'**
  String get notesTapToCaptureFirst;

  /// No description provided for @notesFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load notes'**
  String get notesFailedToLoad;

  /// No description provided for @notesRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get notesRetry;

  /// No description provided for @notesViewCycleSummary.
  ///
  /// In en, this message translates to:
  /// **'View Cycle Summary'**
  String get notesViewCycleSummary;

  /// No description provided for @notesDeleteGradeTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Grade'**
  String get notesDeleteGradeTitle;

  /// No description provided for @notesDeleteGradeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this grade?'**
  String get notesDeleteGradeConfirm;

  /// No description provided for @notesDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get notesDelete;

  /// No description provided for @notesCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get notesCancel;

  /// No description provided for @notesThisWeek.
  ///
  /// In en, this message translates to:
  /// **'This Week'**
  String get notesThisWeek;

  /// No description provided for @notesLastWeek.
  ///
  /// In en, this message translates to:
  /// **'Last Week'**
  String get notesLastWeek;

  /// No description provided for @noteDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Note Detail'**
  String get noteDetailTitle;

  /// No description provided for @noteDetailCouldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load note'**
  String get noteDetailCouldNotLoad;

  /// No description provided for @noteDetailNotFound.
  ///
  /// In en, this message translates to:
  /// **'Grade not found'**
  String get noteDetailNotFound;

  /// No description provided for @noteDetailDateCaptured.
  ///
  /// In en, this message translates to:
  /// **'Date Captured'**
  String get noteDetailDateCaptured;

  /// No description provided for @noteDetailQualityTier.
  ///
  /// In en, this message translates to:
  /// **'Quality Tier'**
  String get noteDetailQualityTier;

  /// No description provided for @noteDetailSettlement.
  ///
  /// In en, this message translates to:
  /// **'Settlement'**
  String get noteDetailSettlement;

  /// No description provided for @noteDetailSettled.
  ///
  /// In en, this message translates to:
  /// **'Settled'**
  String get noteDetailSettled;

  /// No description provided for @noteDetailPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get noteDetailPending;

  /// No description provided for @noteDetailTier1.
  ///
  /// In en, this message translates to:
  /// **'Tier 1 — Excellent'**
  String get noteDetailTier1;

  /// No description provided for @noteDetailTier2.
  ///
  /// In en, this message translates to:
  /// **'Tier 2 — Good'**
  String get noteDetailTier2;

  /// No description provided for @noteDetailTier3.
  ///
  /// In en, this message translates to:
  /// **'Tier 3 — Satisfactory'**
  String get noteDetailTier3;

  /// No description provided for @noteDetailTierBelow.
  ///
  /// In en, this message translates to:
  /// **'Below Threshold'**
  String get noteDetailTierBelow;

  /// No description provided for @noteDetailDeleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Note'**
  String get noteDetailDeleteTitle;

  /// No description provided for @noteDetailDeleteConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this note? This action cannot be undone.'**
  String get noteDetailDeleteConfirm;

  /// No description provided for @noteDetailDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get noteDetailDelete;

  /// No description provided for @noteDetailCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get noteDetailCancel;

  /// No description provided for @captureTitle.
  ///
  /// In en, this message translates to:
  /// **'Capture Grade'**
  String get captureTitle;

  /// No description provided for @capturePositionGrade.
  ///
  /// In en, this message translates to:
  /// **'Position the grade so it is clearly visible'**
  String get capturePositionGrade;

  /// No description provided for @captureChooseFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from Gallery'**
  String get captureChooseFromGallery;

  /// No description provided for @captureTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take Photo'**
  String get captureTakePhoto;

  /// No description provided for @captureLoadingEntry.
  ///
  /// In en, this message translates to:
  /// **'Loading grade entry...'**
  String get captureLoadingEntry;

  /// No description provided for @captureEnterGrade.
  ///
  /// In en, this message translates to:
  /// **'Enter Grade'**
  String get captureEnterGrade;

  /// No description provided for @captureSelectSubjectGrade.
  ///
  /// In en, this message translates to:
  /// **'Select the subject and grade value'**
  String get captureSelectSubjectGrade;

  /// No description provided for @captureSubjectLabel.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get captureSubjectLabel;

  /// No description provided for @captureGradeLabel.
  ///
  /// In en, this message translates to:
  /// **'Grade'**
  String get captureGradeLabel;

  /// No description provided for @captureNoSubjectsLoaded.
  ///
  /// In en, this message translates to:
  /// **'No subjects loaded'**
  String get captureNoSubjectsLoaded;

  /// No description provided for @captureSelectSubjectAndGrade.
  ///
  /// In en, this message translates to:
  /// **'Please select a subject and grade'**
  String get captureSelectSubjectAndGrade;

  /// No description provided for @captureSaveGrade.
  ///
  /// In en, this message translates to:
  /// **'Save Grade'**
  String get captureSaveGrade;

  /// No description provided for @captureCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get captureCancel;

  /// No description provided for @cycleSummaryTitle.
  ///
  /// In en, this message translates to:
  /// **'Cycle Summary'**
  String get cycleSummaryTitle;

  /// No description provided for @cycleSummaryCouldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load grades'**
  String get cycleSummaryCouldNotLoad;

  /// No description provided for @cycleSummaryWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get cycleSummaryWeekly;

  /// No description provided for @cycleSummaryNotesInCycle.
  ///
  /// In en, this message translates to:
  /// **'Notes in this Cycle'**
  String get cycleSummaryNotesInCycle;

  /// No description provided for @cycleSummaryNoGrades.
  ///
  /// In en, this message translates to:
  /// **'No grades in this period'**
  String get cycleSummaryNoGrades;

  /// No description provided for @cycleSummaryPositive.
  ///
  /// In en, this message translates to:
  /// **'Positive'**
  String get cycleSummaryPositive;

  /// No description provided for @cycleSummaryNet.
  ///
  /// In en, this message translates to:
  /// **'Net'**
  String get cycleSummaryNet;

  /// No description provided for @resultsTitle.
  ///
  /// In en, this message translates to:
  /// **'Saved Results'**
  String get resultsTitle;

  /// No description provided for @resultsFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load results'**
  String get resultsFailedToLoad;

  /// No description provided for @resultsRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get resultsRetry;

  /// No description provided for @resultsNoResults.
  ///
  /// In en, this message translates to:
  /// **'No saved results yet'**
  String get resultsNoResults;

  /// No description provided for @resultsUseCalculator.
  ///
  /// In en, this message translates to:
  /// **'Use the calculator to save your first term result.'**
  String get resultsUseCalculator;

  /// No description provided for @resultsOpenCalculator.
  ///
  /// In en, this message translates to:
  /// **'Open Calculator'**
  String get resultsOpenCalculator;

  /// No description provided for @termDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Term Result'**
  String get termDetailTitle;

  /// No description provided for @termDetailCouldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load term'**
  String get termDetailCouldNotLoad;

  /// No description provided for @termDetailNotFound.
  ///
  /// In en, this message translates to:
  /// **'Term not found'**
  String get termDetailNotFound;

  /// No description provided for @termDetailAverage.
  ///
  /// In en, this message translates to:
  /// **'Average'**
  String get termDetailAverage;

  /// No description provided for @termDetailBonus.
  ///
  /// In en, this message translates to:
  /// **'Bonus'**
  String get termDetailBonus;

  /// No description provided for @termDetailSubjects.
  ///
  /// In en, this message translates to:
  /// **'Subjects'**
  String get termDetailSubjects;

  /// No description provided for @termDetailSubjectBreakdown.
  ///
  /// In en, this message translates to:
  /// **'Subject Breakdown'**
  String get termDetailSubjectBreakdown;

  /// No description provided for @insightsTitle.
  ///
  /// In en, this message translates to:
  /// **'Insights'**
  String get insightsTitle;

  /// No description provided for @insightsFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load insights'**
  String get insightsFailedToLoad;

  /// No description provided for @insightsRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get insightsRetry;

  /// No description provided for @insightsNoGradesYet.
  ///
  /// In en, this message translates to:
  /// **'No grades yet'**
  String get insightsNoGradesYet;

  /// No description provided for @insightsAddGradesHint.
  ///
  /// In en, this message translates to:
  /// **'Add grades in the Notes tab to see insights.'**
  String get insightsAddGradesHint;

  /// No description provided for @insightsBonusPointsLastMonths.
  ///
  /// In en, this message translates to:
  /// **'Bonus Points — Last 6 Months'**
  String get insightsBonusPointsLastMonths;

  /// No description provided for @insightsNoBonusPoints.
  ///
  /// In en, this message translates to:
  /// **'No bonus points in the last 6 months'**
  String get insightsNoBonusPoints;

  /// No description provided for @insightsGradeDistribution.
  ///
  /// In en, this message translates to:
  /// **'Grade Distribution'**
  String get insightsGradeDistribution;

  /// No description provided for @insightsThisWeek.
  ///
  /// In en, this message translates to:
  /// **'This Week'**
  String get insightsThisWeek;

  /// No description provided for @insightsAllTime.
  ///
  /// In en, this message translates to:
  /// **'All Time'**
  String get insightsAllTime;

  /// No description provided for @insightsGrades.
  ///
  /// In en, this message translates to:
  /// **'Grades'**
  String get insightsGrades;

  /// No description provided for @insightsEarned.
  ///
  /// In en, this message translates to:
  /// **'Earned'**
  String get insightsEarned;

  /// No description provided for @insightsUnsettled.
  ///
  /// In en, this message translates to:
  /// **'Unsettled'**
  String get insightsUnsettled;

  /// No description provided for @insightsTotalPts.
  ///
  /// In en, this message translates to:
  /// **'Total Pts'**
  String get insightsTotalPts;

  /// No description provided for @insightsPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get insightsPending;

  /// No description provided for @insightsTierBest.
  ///
  /// In en, this message translates to:
  /// **'Best (1–1.4)'**
  String get insightsTierBest;

  /// No description provided for @insightsTierGood.
  ///
  /// In en, this message translates to:
  /// **'Good (1.5–2.4)'**
  String get insightsTierGood;

  /// No description provided for @insightsTierOk.
  ///
  /// In en, this message translates to:
  /// **'OK (2.5–3.4)'**
  String get insightsTierOk;

  /// No description provided for @insightsTierBelow.
  ///
  /// In en, this message translates to:
  /// **'Below (3.5+)'**
  String get insightsTierBelow;

  /// No description provided for @parentDashboardHiName.
  ///
  /// In en, this message translates to:
  /// **'Hi {name}'**
  String parentDashboardHiName(String name);

  /// No description provided for @parentDashboardOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview of your children'**
  String get parentDashboardOverview;

  /// No description provided for @parentDashboardSummary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get parentDashboardSummary;

  /// No description provided for @parentDashboardChildren.
  ///
  /// In en, this message translates to:
  /// **'Children'**
  String get parentDashboardChildren;

  /// No description provided for @parentDashboardPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get parentDashboardPending;

  /// No description provided for @parentDashboardGrades.
  ///
  /// In en, this message translates to:
  /// **'Grades'**
  String get parentDashboardGrades;

  /// No description provided for @parentDashboardChildrenOverview.
  ///
  /// In en, this message translates to:
  /// **'Children Overview'**
  String get parentDashboardChildrenOverview;

  /// No description provided for @parentDashboardNoChildrenConnected.
  ///
  /// In en, this message translates to:
  /// **'No children connected yet.\nGo to Children tab to add one.'**
  String get parentDashboardNoChildrenConnected;

  /// No description provided for @parentDashboardRecentGrade.
  ///
  /// In en, this message translates to:
  /// **'Recent grade'**
  String get parentDashboardRecentGrade;

  /// No description provided for @parentDashboardCouldNotLoadChildren.
  ///
  /// In en, this message translates to:
  /// **'Could not load children data'**
  String get parentDashboardCouldNotLoadChildren;

  /// No description provided for @childrenTitle.
  ///
  /// In en, this message translates to:
  /// **'Children'**
  String get childrenTitle;

  /// No description provided for @childrenNoChildrenConnected.
  ///
  /// In en, this message translates to:
  /// **'No children connected'**
  String get childrenNoChildrenConnected;

  /// No description provided for @childrenShareQrHint.
  ///
  /// In en, this message translates to:
  /// **'Share an invite QR code to connect with a student'**
  String get childrenShareQrHint;

  /// No description provided for @childrenShowInviteQr.
  ///
  /// In en, this message translates to:
  /// **'Show Invite QR'**
  String get childrenShowInviteQr;

  /// No description provided for @childrenInviteStudent.
  ///
  /// In en, this message translates to:
  /// **'Invite a Student'**
  String get childrenInviteStudent;

  /// No description provided for @childrenScanCodeHint.
  ///
  /// In en, this message translates to:
  /// **'Ask the student to scan this code in their app'**
  String get childrenScanCodeHint;

  /// No description provided for @childrenFailedToCreateInvite.
  ///
  /// In en, this message translates to:
  /// **'Failed to create invite'**
  String get childrenFailedToCreateInvite;

  /// No description provided for @childrenRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get childrenRetry;

  /// No description provided for @childrenClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get childrenClose;

  /// No description provided for @childrenFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load children'**
  String get childrenFailedToLoad;

  /// No description provided for @childDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Child Detail'**
  String get childDetailTitle;

  /// No description provided for @childDetailCouldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load data'**
  String get childDetailCouldNotLoad;

  /// No description provided for @childDetailNotFound.
  ///
  /// In en, this message translates to:
  /// **'Child not found'**
  String get childDetailNotFound;

  /// No description provided for @childDetailTermResults.
  ///
  /// In en, this message translates to:
  /// **'Term Results'**
  String get childDetailTermResults;

  /// No description provided for @childDetailNoTermResults.
  ///
  /// In en, this message translates to:
  /// **'No term results saved yet.'**
  String get childDetailNoTermResults;

  /// No description provided for @childDetailCouldNotLoadTermResults.
  ///
  /// In en, this message translates to:
  /// **'Could not load term results'**
  String get childDetailCouldNotLoadTermResults;

  /// No description provided for @childDetailQuickGrades.
  ///
  /// In en, this message translates to:
  /// **'Quick Grades'**
  String get childDetailQuickGrades;

  /// No description provided for @childDetailNoQuickGrades.
  ///
  /// In en, this message translates to:
  /// **'No quick grades yet'**
  String get childDetailNoQuickGrades;

  /// No description provided for @childDetailGrades.
  ///
  /// In en, this message translates to:
  /// **'Grades'**
  String get childDetailGrades;

  /// No description provided for @childDetailTotalPts.
  ///
  /// In en, this message translates to:
  /// **'Total Pts'**
  String get childDetailTotalPts;

  /// No description provided for @childDetailPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get childDetailPending;

  /// No description provided for @childDetailSettled.
  ///
  /// In en, this message translates to:
  /// **'Settled'**
  String get childDetailSettled;

  /// No description provided for @childDetailBonus.
  ///
  /// In en, this message translates to:
  /// **'Bonus'**
  String get childDetailBonus;

  /// No description provided for @childDetailStatus.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get childDetailStatus;

  /// No description provided for @rewardsTitle.
  ///
  /// In en, this message translates to:
  /// **'Rewards'**
  String get rewardsTitle;

  /// No description provided for @rewardsTabQuickGrades.
  ///
  /// In en, this message translates to:
  /// **'Quick Grades'**
  String get rewardsTabQuickGrades;

  /// No description provided for @rewardsTabSummary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get rewardsTabSummary;

  /// No description provided for @rewardsNoChildrenConnected.
  ///
  /// In en, this message translates to:
  /// **'No children connected'**
  String get rewardsNoChildrenConnected;

  /// No description provided for @rewardsFailedToLoadData.
  ///
  /// In en, this message translates to:
  /// **'Failed to load rewards data'**
  String get rewardsFailedToLoadData;

  /// No description provided for @rewardsRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get rewardsRetry;

  /// No description provided for @rewardsNoPendingGrades.
  ///
  /// In en, this message translates to:
  /// **'No pending grades'**
  String get rewardsNoPendingGrades;

  /// No description provided for @rewardsSettle.
  ///
  /// In en, this message translates to:
  /// **'Settle'**
  String get rewardsSettle;

  /// No description provided for @rewardsSettleBonusFor.
  ///
  /// In en, this message translates to:
  /// **'Settle Bonus for {childName}'**
  String rewardsSettleBonusFor(String childName);

  /// No description provided for @rewardsAmountToTransfer.
  ///
  /// In en, this message translates to:
  /// **'Amount to transfer'**
  String get rewardsAmountToTransfer;

  /// No description provided for @rewardsCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get rewardsCancel;

  /// No description provided for @rewardsConfirmSettle.
  ///
  /// In en, this message translates to:
  /// **'Confirm Settle'**
  String get rewardsConfirmSettle;

  /// No description provided for @rewardsSettled.
  ///
  /// In en, this message translates to:
  /// **'Settled!'**
  String get rewardsSettled;

  /// No description provided for @parentInsightsTitle.
  ///
  /// In en, this message translates to:
  /// **'Insights'**
  String get parentInsightsTitle;

  /// No description provided for @parentInsightsFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load insights'**
  String get parentInsightsFailedToLoad;

  /// No description provided for @parentInsightsRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get parentInsightsRetry;

  /// No description provided for @parentInsightsNoInsights.
  ///
  /// In en, this message translates to:
  /// **'No insights yet'**
  String get parentInsightsNoInsights;

  /// No description provided for @parentInsightsNoInsightsHint.
  ///
  /// In en, this message translates to:
  /// **'Connect children to see their grade insights'**
  String get parentInsightsNoInsightsHint;

  /// No description provided for @parentInsightsAllChildrenSummary.
  ///
  /// In en, this message translates to:
  /// **'All Children — Summary'**
  String get parentInsightsAllChildrenSummary;

  /// No description provided for @parentInsightsTotalEarned.
  ///
  /// In en, this message translates to:
  /// **'Total Earned'**
  String get parentInsightsTotalEarned;

  /// No description provided for @parentInsightsPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get parentInsightsPending;

  /// No description provided for @parentInsightsChildren.
  ///
  /// In en, this message translates to:
  /// **'Children'**
  String get parentInsightsChildren;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navCalculator.
  ///
  /// In en, this message translates to:
  /// **'Calculator'**
  String get navCalculator;

  /// No description provided for @parentDashboardChildSubtitle.
  ///
  /// In en, this message translates to:
  /// **'{count} grades · {pts} pts pending'**
  String parentDashboardChildSubtitle(int count, int pts);

  /// No description provided for @termDetailDeleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Result'**
  String get termDetailDeleteTitle;

  /// No description provided for @termDetailDeleteConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this result? This action cannot be undone.'**
  String get termDetailDeleteConfirm;

  /// No description provided for @termDetailDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get termDetailDelete;

  /// No description provided for @termDetailEditLabel.
  ///
  /// In en, this message translates to:
  /// **'Edit Label'**
  String get termDetailEditLabel;

  /// No description provided for @calculatorLabelHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Final exam'**
  String get calculatorLabelHint;

  /// No description provided for @studentNotesCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{{count} note} other{{count} notes}}'**
  String studentNotesCount(int count);

  /// No description provided for @calculatorNoSubjectsMatch.
  ///
  /// In en, this message translates to:
  /// **'No subjects match \"{query}\"'**
  String calculatorNoSubjectsMatch(String query);

  /// No description provided for @calculatorRemoveSubject.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get calculatorRemoveSubject;

  /// No description provided for @calculatorFailedToSave.
  ///
  /// In en, this message translates to:
  /// **'Failed to save: {error}'**
  String calculatorFailedToSave(String error);

  /// No description provided for @calculatorSubjectsLabel.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{{count} subject} other{{count} subjects}}'**
  String calculatorSubjectsLabel(int count);

  /// No description provided for @calculatorGradeHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. {example}'**
  String calculatorGradeHint(String example);

  /// No description provided for @childrenGradesCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{{count} grade} other{{count} grades}}'**
  String childrenGradesCount(int count);

  /// No description provided for @childrenView.
  ///
  /// In en, this message translates to:
  /// **'View'**
  String get childrenView;

  /// No description provided for @childrenPtsPending.
  ///
  /// In en, this message translates to:
  /// **'{pts} pts pending'**
  String childrenPtsPending(int pts);

  /// No description provided for @rewardsSummarySubtitle.
  ///
  /// In en, this message translates to:
  /// **'{count} grades · {pts} pts total'**
  String rewardsSummarySubtitle(int count, int pts);

  /// No description provided for @subjectFallback.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get subjectFallback;

  /// No description provided for @genericFailedError.
  ///
  /// In en, this message translates to:
  /// **'Error: {error}'**
  String genericFailedError(String error);

  /// No description provided for @forgotPasswordCooldownMessage.
  ///
  /// In en, this message translates to:
  /// **'Please wait {seconds} seconds before requesting another code.'**
  String forgotPasswordCooldownMessage(int seconds);

  /// No description provided for @cycleTypeDaily.
  ///
  /// In en, this message translates to:
  /// **'Daily'**
  String get cycleTypeDaily;

  /// No description provided for @cycleTypeWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get cycleTypeWeekly;

  /// No description provided for @cycleTypeMonthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get cycleTypeMonthly;

  /// No description provided for @notesNetPointsLabel.
  ///
  /// In en, this message translates to:
  /// **'Net: {pts} pts'**
  String notesNetPointsLabel(String pts);

  /// No description provided for @childrenInviteCode.
  ///
  /// In en, this message translates to:
  /// **'Code: {code}'**
  String childrenInviteCode(String code);

  /// No description provided for @ptsAbbr.
  ///
  /// In en, this message translates to:
  /// **'pts'**
  String get ptsAbbr;

  /// No description provided for @bonusPtsLabel.
  ///
  /// In en, this message translates to:
  /// **'bonus pts'**
  String get bonusPtsLabel;

  /// No description provided for @totalGradesLabel.
  ///
  /// In en, this message translates to:
  /// **'total grades'**
  String get totalGradesLabel;

  /// No description provided for @classLabel.
  ///
  /// In en, this message translates to:
  /// **'Class'**
  String get classLabel;

  /// No description provided for @ratioLabel.
  ///
  /// In en, this message translates to:
  /// **'ratio'**
  String get ratioLabel;

  /// No description provided for @genericRequestFailed.
  ///
  /// In en, this message translates to:
  /// **'Request failed'**
  String get genericRequestFailed;

  /// No description provided for @parentFallback.
  ///
  /// In en, this message translates to:
  /// **'Parent'**
  String get parentFallback;

  /// No description provided for @calculatorSchoolYearHint.
  ///
  /// In en, this message translates to:
  /// **'2024/25'**
  String get calculatorSchoolYearHint;

  /// No description provided for @registerDateOfBirthLabel.
  ///
  /// In en, this message translates to:
  /// **'Date of Birth'**
  String get registerDateOfBirthLabel;

  /// No description provided for @registerDateOfBirthHint.
  ///
  /// In en, this message translates to:
  /// **'Select date of birth'**
  String get registerDateOfBirthHint;

  /// No description provided for @registerDateOfBirthRequired.
  ///
  /// In en, this message translates to:
  /// **'Please select your date of birth'**
  String get registerDateOfBirthRequired;

  /// No description provided for @captureClassLevelLabel.
  ///
  /// In en, this message translates to:
  /// **'Class Level'**
  String get captureClassLevelLabel;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'de',
    'en',
    'es',
    'fr',
    'it',
    'ru',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'it':
      return AppLocalizationsIt();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
