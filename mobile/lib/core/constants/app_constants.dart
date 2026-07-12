class AppConstants {
  AppConstants._();

  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://bonifatus.com');
  static const String bundleId = 'com.bonifatus.app';
  static const String appName = 'Bonifatus';

  // First-launch flag (SharedPreferences, not secure storage)
  static const String keySeenOnboarding = 'seen_onboarding';

  // Secure storage keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserId = 'user_id';
  static const String keyUserRole = 'user_role';
  static const String keyDeviceId = 'device_id';
  static const String keyBiometricEnabled = 'biometric_enabled';
  static const String keyBiometricJwt = 'biometric_jwt';
  static const String keyThemeMode = 'theme_mode';
  static const String keyLocale = 'locale';

  // Hive box names
  static const String boxTerms = 'terms';
  static const String boxNotes = 'notes';
  static const String boxCycles = 'cycles';
  static const String boxConfig = 'config';

  // Supported locales
  static const List<String> supportedLocales = ['en', 'de', 'fr', 'it', 'es', 'ru'];

  // Language metadata for UI selectors — (code, name, flag)
  static const languages = [
    (code: 'en', name: 'English', flag: '🇬🇧'),
    (code: 'de', name: 'Deutsch', flag: '🇩🇪'),
    (code: 'fr', name: 'Français', flag: '🇫🇷'),
    (code: 'it', name: 'Italiano', flag: '🇮🇹'),
    (code: 'es', name: 'Español', flag: '🇪🇸'),
    (code: 'ru', name: 'Русский', flag: '🇷🇺'),
  ];

  // Grade tiers
  static const String tierBest = 'best';
  static const String tierSecond = 'second';
  static const String tierThird = 'third';
  static const String tierBelow = 'below';

  // Ongoing cycle types
  static const String cycleDaily = 'daily';
  static const String cycleWeekly = 'weekly';
  static const String cycleMonthly = 'monthly';

  static const double defaultOngoingRatio = 0.25;
}
