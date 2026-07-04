import 'package:flutter_riverpod/flutter_riverpod.dart';

// Pre-loaded in main() before runApp; overridden via ProviderScope.overrides.
final hasSeenOnboardingProvider = Provider<bool>((ref) => false);
