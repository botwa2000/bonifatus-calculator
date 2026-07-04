import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'core/constants/app_constants.dart';
import 'core/providers/onboarding_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
  ));

  final prefs = await SharedPreferences.getInstance();
  final hasSeenOnboarding = prefs.getBool(AppConstants.keySeenOnboarding) ?? false;

  runApp(ProviderScope(
    overrides: [
      hasSeenOnboardingProvider.overrideWithValue(hasSeenOnboarding),
    ],
    child: const BonifatusApp(),
  ));
}
