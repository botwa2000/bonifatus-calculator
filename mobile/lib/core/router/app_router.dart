import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/verify_email_screen.dart';
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
import '../../features/parent/rewards/screens/rewards_screen.dart';
import '../../features/parent/insights/parent_insights_screen.dart';
import '../../features/parent/settings/screens/parent_settings_screen.dart';
import '../shells/student_shell.dart';
import '../shells/parent_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final listenable = _AuthListenable(ref);

  return GoRouter(
    initialLocation: '/onboarding',
    refreshListenable: listenable,
    redirect: (context, state) {
      final authState = ref.read(authStateNotifierProvider);
      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final loc = state.matchedLocation;
      final isAuthRoute = loc.startsWith('/auth') || loc == '/onboarding';

      if (!isAuthenticated && !isAuthRoute) return '/onboarding';
      if (isAuthenticated && isAuthRoute) {
        final role = authState.valueOrNull?.role ?? 'child';
        return role == 'parent' ? '/parent/home' : '/student/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
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
              GoRoute(path: 'capture', builder: (_, __) => const CaptureScreen()),
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
          GoRoute(path: '/parent/children', builder: (_, __) => const ChildrenScreen()),
          GoRoute(path: '/parent/rewards', builder: (_, __) => const RewardsScreen()),
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
