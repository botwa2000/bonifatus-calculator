import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/api/services/profile_service.dart';
import 'package:bonifatus_mobile/features/auth/providers/auth_provider.dart';
import 'package:bonifatus_mobile/features/student/dashboard/student_dashboard_screen.dart';
import 'package:bonifatus_mobile/features/student/providers/quick_grades_provider.dart';
import 'package:bonifatus_mobile/features/student/providers/term_results_provider.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:bonifatus_mobile/models/quick_grade.dart';
import 'package:bonifatus_mobile/models/term_result.dart';

class _NoGrades extends QuickGradesNotifier {
  @override
  Future<List<QuickGrade>> build() async => [];
}

class _NoTerms extends TermResultsNotifier {
  @override
  Future<List<TermResult>> build() async => [];
}

class _SignedOut extends AuthStateNotifier {
  @override
  Future<AuthState> build() async => AuthState.unauthenticated();
}

class _CompleteProfile implements ProfileService {
  @override
  Future<Map<String, dynamic>> fetchProfile() async => {
        'fullName': 'Kid',
        'dateOfBirth': '2015-01-01',
        'schoolName': 'School',
        'defaultGradingSystemId': 'x',
      };
  @override
  dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

void main() {
  testWidgets('first run: student with no grades sees the get-started card and it leads to capture',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.75;
    addTearDown(tester.view.reset);

    final pushed = <String>[];
    final router = GoRouter(
      initialLocation: '/student/home',
      routes: [
        GoRoute(path: '/student/home', builder: (_, __) => const StudentDashboardScreen()),
        GoRoute(path: '/student/notes/capture', builder: (_, __) {
          pushed.add('capture');
          return const Scaffold(body: Text('capture-screen'));
        }),
        GoRoute(path: '/student/settings', builder: (_, __) {
          pushed.add('settings');
          return const Scaffold(body: Text('settings-screen'));
        }),
        GoRoute(path: '/student/calculator', builder: (_, __) => const SizedBox()),
      ],
    );

    await tester.pumpWidget(ProviderScope(
      overrides: [
        quickGradesProvider.overrideWith(_NoGrades.new),
        termResultsProvider.overrideWith(_NoTerms.new),
        authStateNotifierProvider.overrideWith(_SignedOut.new),
        profileServiceProvider.overrideWithValue(_CompleteProfile()),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        locale: const Locale('de'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('get-started-card')), findsOneWidget);
    expect(find.text('Erste Note eintragen'), findsOneWidget);
    expect(find.text('Mit Eltern verbinden'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.byKey(const Key('get-started-add-grade')));
    await tester.pumpAndSettle();
    expect(find.text('capture-screen'), findsOneWidget);
    expect(pushed, ['capture']);
  });
}
