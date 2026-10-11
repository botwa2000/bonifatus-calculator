import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'core/constants/app_constants.dart';
import 'core/providers/onboarding_provider.dart';
import 'core/review/review_prompt.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  if (AppConstants.googleWebClientId.isNotEmpty) {
    await GoogleSignIn.instance.initialize(
      serverClientId: AppConstants.googleWebClientId,
    );
  }

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

  final reviewPrompt = ReviewPromptService(InAppReview.instance);
  await reviewPrompt.markFirstUse();

  runApp(ProviderScope(
    overrides: [
      hasSeenOnboardingProvider.overrideWithValue(hasSeenOnboarding),
      reviewPromptServiceProvider.overrideWithValue(reviewPrompt),
    ],
    child: const BonifatusApp(),
  ));
}
