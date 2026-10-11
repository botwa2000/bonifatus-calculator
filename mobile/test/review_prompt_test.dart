import 'package:bonifatus_mobile/core/constants/app_constants.dart';
import 'package:bonifatus_mobile/core/review/review_prompt.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:in_app_review_platform_interface/in_app_review_platform_interface.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeReviewPlatform extends InAppReviewPlatform {
  bool available = true;
  int requests = 0;
  int listingOpens = 0;

  @override
  Future<bool> isAvailable() async => available;

  @override
  Future<void> requestReview() async => requests++;

  @override
  Future<void> openStoreListing({String? appStoreId, String? microsoftStoreId}) async => listingOpens++;
}

void main() {
  final t0 = DateTime(2026, 10, 1, 12);

  group('ReviewPromptPolicy', () {
    ReviewPromptState state({int successes = 0, int asks = 0, DateTime? lastAsk, int atLastAsk = 0}) =>
        ReviewPromptState(
          firstUseAt: t0,
          successCount: successes,
          askCount: asks,
          lastAskAt: lastAsk,
          successCountAtLastAsk: atLastAsk,
        );

    bool ask(ReviewPromptState s, DateTime now, {bool error = false}) =>
        ReviewPromptPolicy.shouldAsk(s, now, hadErrorThisSession: error);

    test('first ask needs 3 successes and 3 days since first use', () {
      final later = t0.add(const Duration(days: 3));
      expect(ask(state(successes: 2), later), isFalse);
      expect(ask(state(successes: 3), t0.add(const Duration(days: 2, hours: 23))), isFalse);
      expect(ask(state(successes: 3), later), isTrue);
    });

    test('an error this session suppresses the ask', () {
      expect(ask(state(successes: 5), t0.add(const Duration(days: 10)), error: true), isFalse);
    });

    test('second ask needs 10 more successes and 30 days since the first ask', () {
      final firstAsk = t0.add(const Duration(days: 3));
      final s9 = state(successes: 12, asks: 1, lastAsk: firstAsk, atLastAsk: 3);
      final s10 = state(successes: 13, asks: 1, lastAsk: firstAsk, atLastAsk: 3);
      expect(ask(s9, firstAsk.add(const Duration(days: 60))), isFalse);
      expect(ask(s10, firstAsk.add(const Duration(days: 29))), isFalse);
      expect(ask(s10, firstAsk.add(const Duration(days: 30))), isTrue);
    });

    test('never more than two asks', () {
      final s = state(successes: 100, asks: 2, lastAsk: t0, atLastAsk: 13);
      expect(ask(s, t0.add(const Duration(days: 400))), isFalse);
    });
  });

  group('ReviewPromptService', () {
    late _FakeReviewPlatform platform;
    late DateTime now;
    late ReviewPromptService service;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      platform = _FakeReviewPlatform();
      InAppReviewPlatform.instance = platform;
      now = t0;
      service = ReviewPromptService(InAppReview.instance, now: () => now);
    });

    Future<void> successes(int n) async {
      for (var i = 0; i < n; i++) {
        await service.recordSuccess();
      }
    }

    test('full lifecycle: ask after 3, again after 10 more, then never', () async {
      await service.markFirstUse();

      await successes(3);
      expect(platform.requests, 0, reason: 'install is younger than 3 days');

      now = t0.add(const Duration(days: 3));
      await successes(1);
      expect(platform.requests, 1);

      now = now.add(const Duration(days: 31));
      await successes(9);
      expect(platform.requests, 1, reason: 'only 9 successes since the first ask');
      await successes(1);
      expect(platform.requests, 2);

      now = now.add(const Duration(days: 400));
      await successes(50);
      expect(platform.requests, 2);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt(AppConstants.keyReviewAskCount), 2);
      expect(prefs.getInt(AppConstants.keyReviewSuccessCount), 64);
    });

    test('history survives a restart (new service instance)', () async {
      await service.markFirstUse();
      now = t0.add(const Duration(days: 5));
      await successes(3);
      expect(platform.requests, 1);

      final restarted = ReviewPromptService(InAppReview.instance, now: () => now.add(const Duration(days: 1)));
      await restarted.markFirstUse();
      await restarted.recordSuccess();
      expect(platform.requests, 1, reason: 'first ask is persisted, the second needs 10 more and 30 days');
    });

    test('a failure blocks the prompt for the rest of the session only', () async {
      await service.markFirstUse();
      now = t0.add(const Duration(days: 5));
      service.recordFailure();
      await successes(5);
      expect(platform.requests, 0);

      final nextSession = ReviewPromptService(InAppReview.instance, now: () => now);
      await nextSession.recordSuccess();
      expect(platform.requests, 1);
    });

    test('unavailable store: no ask is recorded', () async {
      platform.available = false;
      await service.markFirstUse();
      now = t0.add(const Duration(days: 5));
      await successes(3);
      expect(platform.requests, 0);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt(AppConstants.keyReviewAskCount), isNull);
    });

    test('opening the store listing does not count as an ask', () async {
      await service.openStoreListing();
      expect(platform.listingOpens, 1);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt(AppConstants.keyReviewAskCount), isNull);
    });
  });
}
