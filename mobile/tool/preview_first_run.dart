// Dev-only render harness (never imported by the app): mounts the real student
// dashboard with no grades/terms so the first-run card can be checked on an
// emulator without signing in. `flutter run -t tool/preview_first_run.dart`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/api/services/profile_service.dart';
import 'package:bonifatus_mobile/core/theme/app_theme.dart';
import 'package:bonifatus_mobile/features/auth/providers/auth_provider.dart';
import 'package:bonifatus_mobile/features/student/dashboard/student_dashboard_screen.dart';
import 'package:bonifatus_mobile/features/student/providers/quick_grades_provider.dart';
import 'package:bonifatus_mobile/features/student/providers/term_results_provider.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:bonifatus_mobile/models/quick_grade.dart';
import 'package:bonifatus_mobile/models/term_result.dart';

class _NoGrades extends QuickGradesNotifier { @override Future<List<QuickGrade>> build() async => []; }
class _NoTerms extends TermResultsNotifier { @override Future<List<TermResult>> build() async => []; }
class _SignedOut extends AuthStateNotifier { @override Future<AuthState> build() async => AuthState.unauthenticated(); }
class _NewProfile implements ProfileService {
  @override Future<Map<String, dynamic>> fetchProfile() async => {'fullName': 'Maxim'};
  @override dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

void main() {
  final router = GoRouter(initialLocation: '/student/home', routes: [
    GoRoute(path: '/student/home', builder: (_, __) => const StudentDashboardScreen()),
    GoRoute(path: '/student/notes/capture', builder: (_, __) => const Scaffold(body: Center(child: Text('capture')))),
    GoRoute(path: '/student/settings', builder: (_, __) => const Scaffold(body: Center(child: Text('settings')))),
    GoRoute(path: '/student/calculator', builder: (_, __) => const SizedBox()),
  ]);
  runApp(ProviderScope(
    overrides: [
      quickGradesProvider.overrideWith(_NoGrades.new),
      termResultsProvider.overrideWith(_NoTerms.new),
      authStateNotifierProvider.overrideWith(_SignedOut.new),
      profileServiceProvider.overrideWithValue(_NewProfile()),
    ],
    child: MaterialApp.router(
      routerConfig: router,
      theme: AppTheme.light,
      locale: const Locale('de'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  ));
}
