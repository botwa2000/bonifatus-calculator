import 'dart:math';

import 'package:bonifatus_mobile/core/feedback/feedback_ui.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFeedbackApi implements FeedbackApi {
  final appRatings = <(int, String)>[];
  final resultRatings = <(String, int)>[];
  bool fail = false;

  @override
  Future<void> rateApp(int rating, String comment, String lang) async {
    if (fail) throw Exception('offline');
    appRatings.add((rating, comment));
  }

  @override
  Future<void> rateResult(String action, int rating) async => resultRatings.add((action, rating));
}

Widget _app(_FakeFeedbackApi api, Widget child) => ProviderScope(
      overrides: [feedbackApiProvider.overrideWithValue(api)],
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(body: child),
      ),
    );

void main() {
  testWidgets('feedback sheet requires a rating, then sends rating + comment', (tester) async {
    final api = _FakeFeedbackApi();
    await tester.pumpWidget(_app(api, const FeedbackSheet()));

    await tester.tap(find.byKey(const Key('feedbackSend')));
    await tester.pump();
    expect(find.text('Please choose a rating first.'), findsOneWidget);
    expect(api.appRatings, isEmpty);

    await tester.tap(find.byKey(const Key('star4')));
    await tester.enterText(find.byKey(const Key('feedbackComment')), 'Toll!');
    await tester.tap(find.byKey(const Key('feedbackSend')));
    await tester.pumpAndSettle();
    expect(api.appRatings, [(4, 'Toll!')]);
  });

  testWidgets('feedback sheet shows an error when sending fails', (tester) async {
    final api = _FakeFeedbackApi()..fail = true;
    await tester.pumpWidget(_app(api, const FeedbackSheet()));
    await tester.tap(find.byKey(const Key('star5')));
    await tester.tap(find.byKey(const Key('feedbackSend')));
    await tester.pumpAndSettle();
    expect(find.text('Your feedback could not be sent. Please try again.'), findsOneWidget);
  });

  testWidgets('result rating is one tap and then locked', (tester) async {
    final api = _FakeFeedbackApi();
    await tester.pumpWidget(_app(api, const ResultRatingBar(action: 'report_scan')));
    await tester.tap(find.byKey(const Key('star3')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('star5')));
    await tester.pumpAndSettle();
    expect(api.resultRatings, [('report_scan', 3)]);
    expect(find.text('Thanks for rating!'), findsOneWidget);
  });

  testWidgets('parental gate only opens with the right answer', (tester) async {
    bool? result;
    await tester.pumpWidget(_app(
      _FakeFeedbackApi(),
      Builder(
        builder: (context) => TextButton(
          onPressed: () async => result = await showParentalGate(context, random: Random(1)),
          child: const Text('open'),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    final question = tester.widget<Text>(find.textContaining('×')).data!;
    final m = RegExp(r'(\d+) × (\d+)').firstMatch(question)!;
    final answer = int.parse(m.group(1)!) * int.parse(m.group(2)!);

    await tester.enterText(find.byKey(const Key('parentalGateAnswer')), '${answer + 1}');
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('That is not right. Please ask a parent.'), findsOneWidget);
    expect(result, isNull);

    await tester.enterText(find.byKey(const Key('parentalGateAnswer')), '$answer');
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(result, isTrue);
  });
}
