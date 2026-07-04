import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class LocaleNotifier extends AsyncNotifier<Locale?> {
  @override
  Future<Locale?> build() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(AppConstants.keyLocale);
    if (stored == null) return null;
    return Locale(stored);
  }

  Future<void> setLocale(Locale? locale) async {
    state = AsyncValue.data(locale);
    final prefs = await SharedPreferences.getInstance();
    if (locale == null) {
      await prefs.remove(AppConstants.keyLocale);
    } else {
      await prefs.setString(AppConstants.keyLocale, locale.languageCode);
    }
  }
}

final localeProvider =
    AsyncNotifierProvider<LocaleNotifier, Locale?>(LocaleNotifier.new);
