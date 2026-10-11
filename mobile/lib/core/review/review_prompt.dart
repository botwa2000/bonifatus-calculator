import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

/// Locally persisted review-prompt history for this install.
///
/// Neither store reports whether the system dialog was shown or whether a
/// review was left, so "asks" counts the times the app requested the dialog.
/// Both stores also cap how often it appears, so a request is never a guarantee.
@immutable
class ReviewPromptState {
  final DateTime firstUseAt;
  final int successCount;
  final int askCount;
  final DateTime? lastAskAt;
  final int successCountAtLastAsk;

  const ReviewPromptState({
    required this.firstUseAt,
    this.successCount = 0,
    this.askCount = 0,
    this.lastAskAt,
    this.successCountAtLastAsk = 0,
  });

  ReviewPromptState copyWith({
    int? successCount,
    int? askCount,
    DateTime? lastAskAt,
    int? successCountAtLastAsk,
  }) =>
      ReviewPromptState(
        firstUseAt: firstUseAt,
        successCount: successCount ?? this.successCount,
        askCount: askCount ?? this.askCount,
        lastAskAt: lastAskAt ?? this.lastAskAt,
        successCountAtLastAsk: successCountAtLastAsk ?? this.successCountAtLastAsk,
      );
}

/// When to ask for a store review. Pure, so it can be unit tested.
class ReviewPromptPolicy {
  ReviewPromptPolicy._();

  /// First ask after this many successful actions…
  static const int firstAskAfterSuccesses = 3;

  /// …and not before the app has been in use on this device for this long.
  static const Duration minTimeSinceFirstUse = Duration(days: 3);

  /// Second ask after this many further successful actions…
  static const int repeatAskAfterSuccesses = 10;

  /// …and not sooner than this after the previous ask.
  static const Duration minTimeBetweenAsks = Duration(days: 30);

  /// Never ask more often than this per install. Apple allows at most three
  /// dialogs per 365 days, so two keeps us inside that.
  static const int maxAsks = 2;

  static bool shouldAsk(ReviewPromptState s, DateTime now, {required bool hadErrorThisSession}) {
    if (hadErrorThisSession) return false;
    if (s.askCount >= maxAsks) return false;
    if (s.askCount == 0) {
      return s.successCount >= firstAskAfterSuccesses &&
          now.difference(s.firstUseAt) >= minTimeSinceFirstUse;
    }
    final lastAskAt = s.lastAskAt;
    if (lastAskAt == null) return false;
    return s.successCount - s.successCountAtLastAsk >= repeatAskAfterSuccesses &&
        now.difference(lastAskAt) >= minTimeBetweenAsks;
  }
}

/// Counts successful actions (saved result, saved grades, completed settlement)
/// and requests the native store review dialog when [ReviewPromptPolicy] allows.
class ReviewPromptService {
  final InAppReview _inAppReview;
  final DateTime Function() _now;
  bool _hadErrorThisSession = false;

  ReviewPromptService(this._inAppReview, {DateTime Function()? now}) : _now = now ?? DateTime.now;

  /// Call after an action failed. Suppresses the prompt for the rest of the session.
  void recordFailure() => _hadErrorThisSession = true;

  /// Call after an action succeeded. May show the system review dialog.
  Future<void> recordSuccess() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final state = await _load(prefs);
      final updated = state.copyWith(successCount: state.successCount + 1);
      await prefs.setInt(AppConstants.keyReviewSuccessCount, updated.successCount);

      final now = _now();
      final ask = ReviewPromptPolicy.shouldAsk(updated, now, hadErrorThisSession: _hadErrorThisSession);
      _log('success ${updated.successCount}, asks ${updated.askCount}, ask now: $ask');
      if (!ask || !await _inAppReview.isAvailable()) return;

      // Persist before requesting so a crash or kill inside the native dialog
      // can never cause a repeat ask.
      await prefs.setInt(AppConstants.keyReviewAskCount, updated.askCount + 1);
      await prefs.setInt(AppConstants.keyReviewLastAskAt, now.millisecondsSinceEpoch);
      await prefs.setInt(AppConstants.keyReviewSuccessesAtLastAsk, updated.successCount);
      _log('requesting store review (ask ${updated.askCount + 1})');
      await _inAppReview.requestReview();
    } catch (e) {
      // A review prompt must never break the action that triggered it.
      _log('failed: $e');
    }
  }

  /// Opens the store listing directly (Settings → Rate Bonifatus). Not subject
  /// to the store quotas and does not count as an ask.
  Future<void> openStoreListing() =>
      _inAppReview.openStoreListing(appStoreId: AppConstants.appStoreId);

  Future<ReviewPromptState> _load(SharedPreferences prefs) async {
    var firstUseMs = prefs.getInt(AppConstants.keyReviewFirstUseAt);
    if (firstUseMs == null) {
      firstUseMs = _now().millisecondsSinceEpoch;
      await prefs.setInt(AppConstants.keyReviewFirstUseAt, firstUseMs);
    }
    final lastAskMs = prefs.getInt(AppConstants.keyReviewLastAskAt);
    return ReviewPromptState(
      firstUseAt: DateTime.fromMillisecondsSinceEpoch(firstUseMs),
      successCount: prefs.getInt(AppConstants.keyReviewSuccessCount) ?? 0,
      askCount: prefs.getInt(AppConstants.keyReviewAskCount) ?? 0,
      lastAskAt: lastAskMs == null ? null : DateTime.fromMillisecondsSinceEpoch(lastAskMs),
      successCountAtLastAsk: prefs.getInt(AppConstants.keyReviewSuccessesAtLastAsk) ?? 0,
    );
  }

  /// Records the first-use timestamp at app start, so the minimum-age rule
  /// measures from first launch rather than from the first successful action.
  Future<void> markFirstUse() async {
    try {
      await _load(await SharedPreferences.getInstance());
    } catch (e) {
      _log('failed: $e');
    }
  }

  static void _log(String message) {
    if (kDebugMode) debugPrint('[ReviewPrompt] $message');
  }
}

final reviewPromptServiceProvider = Provider<ReviewPromptService>(
  (ref) => ReviewPromptService(InAppReview.instance),
);
