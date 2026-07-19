import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/verify_email_screen.dart';
import '../../features/auth/screens/google_profile_screen.dart';
import '../../features/student/dashboard/student_dashboard_screen.dart';
import '../../features/student/notes/screens/notes_screen.dart';
import '../../features/student/notes/screens/capture_screen.dart';
import '../../features/student/notes/screens/note_detail_screen.dart';
import '../../features/student/notes/screens/cycle_summary_screen.dart';
import '../../features/student/calculator/screens/calculator_screen.dart';
import '../../features/student/results/screens/results_screen.dart';
import '../../features/student/results/screens/term_detail_screen.dart';
import '../../features/student/insights/student_insights_screen.dart';
import '../../features/student/settings/screens/student_settings_screen.dart';
import '../../features/parent/dashboard/parent_dashboard_screen.dart';
import '../../features/parent/children/screens/children_screen.dart';
import '../../features/parent/children/screens/child_detail_screen.dart';
import '../../features/parent/settle/screens/settle_screen.dart';
import '../../features/parent/insights/parent_insights_screen.dart';
import '../../features/parent/settings/screens/parent_settings_screen.dart';
import '../shells/student_shell.dart';
import '../shells/parent_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final listenable = _AuthListenable(ref);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: listenable,
    redirect: (context, state) {
      final authState = ref.read(authStateNotifierProvider);
      final loc = state.matchedLocation;

      // Hold at splash while session is being restored — prevents login screen
      // from mounting (and showing the biometric button) before auth resolves.
      // Exception: don't redirect away from auth/onboarding routes during loading
      // (e.g. mid-login submission) — doing so would destroy the LoginScreen before
      // it can display the error returned by the failed request.
      if (authState.isLoading) {
        final isAuthOrSplash = loc == '/splash' || loc.startsWith('/auth') || loc == '/onboarding';
        return isAuthOrSplash ? null : '/splash';
      }

      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final hasSeen = ref.read(hasSeenOnboardingProvider);
      final isAuthRoute = loc.startsWith('/auth') || loc == '/onboarding' || loc == '/splash';

      // Once auth is resolved, always leave the splash screen immediately.
      if (loc == '/splash') {
        if (!isAuthenticated) return hasSeen ? '/auth/login' : '/onboarding';
        final role = authState.valueOrNull?.role ?? 'child';
        return role == 'parent' ? '/parent/home' : '/student/home';
      }

      // Returning user: skip the onboarding walkthrough and go straight to login
      if (!isAuthenticated && loc == '/onboarding' && hasSeen) return '/auth/login';

      // Any protected route while unauthenticated
      if (!isAuthenticated && !isAuthRoute) {
        return hasSeen ? '/auth/login' : '/onboarding';
      }

      // Authenticated user landing on an auth/onboarding screen → go home
      if (isAuthenticated && isAuthRoute) {
        final role = authState.valueOrNull?.role ?? 'child';
        return role == 'parent' ? '/parent/home' : '/student/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/student/notes/capture', builder: (_, __) => const CaptureScreen()),
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/auth/google-profile',
        builder: (_, state) {
          final data = state.extra as Map<String, String>;
          return GoogleProfileScreen(
            idToken: data['idToken']!,
            name: data['name']!,
            email: data['email']!,
          );
        },
      ),
      GoRoute(path: '/auth/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/auth/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/auth/verify-email',
        builder: (_, state) => VerifyEmailScreen(
          userId: state.uri.queryParameters['userId'] ?? '',
          email: state.uri.queryParameters['email'] ?? '',
          purpose: state.uri.queryParameters['purpose'] ?? 'email_verification',
        ),
      ),

      ShellRoute(
        builder: (_, __, child) => StudentShell(child: child),
        routes: [
          GoRoute(path: '/student/home', builder: (_, __) => const StudentDashboardScreen()),
          GoRoute(
            path: '/student/notes',
            builder: (_, __) => const NotesScreen(),
            routes: [
              GoRoute(
                path: 'detail/:id',
                builder: (_, state) =>
                    NoteDetailScreen(noteId: state.pathParameters['id']!),
              ),
              GoRoute(
                path: 'cycle/:id',
                builder: (_, state) =>
                    CycleSummaryScreen(cycleId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(path: '/student/calculator', builder: (_, __) => const CalculatorScreen()),
          GoRoute(
            path: '/student/results',
            builder: (_, __) => const ResultsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (_, state) =>
                    TermDetailScreen(termId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(path: '/student/insights', builder: (_, __) => const StudentInsightsScreen()),
          GoRoute(path: '/student/settings', builder: (_, __) => const StudentSettingsScreen()),
        ],
      ),

      ShellRoute(
        builder: (_, __, child) => ParentShell(child: child),
        routes: [
          GoRoute(path: '/parent/home', builder: (_, __) => const ParentDashboardScreen()),
          GoRoute(
            path: '/parent/children',
            builder: (_, __) => const ChildrenScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (_, state) =>
                    ChildDetailScreen(childId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(path: '/parent/settle', builder: (_, __) => const SettleScreen()),
          GoRoute(path: '/parent/rewards', redirect: (_, __) => '/parent/settle'),
          GoRoute(path: '/parent/insights', builder: (_, __) => const ParentInsightsScreen()),
          GoRoute(path: '/parent/settings', builder: (_, __) => const ParentSettingsScreen()),
        ],
      ),
    ],
  );
});

class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authStateNotifierProvider, (_, __) => notifyListeners());
  }
}
