import 'dart:convert';

import 'package:bonifatus_mobile/core/usage/usage_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Records every request; fails while [online] is false.
class _FakeAdapter implements HttpClientAdapter {
  final requests = <RequestOptions>[];
  bool online = true;

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<List<int>>? requestStream, Future<void>? cancelFuture) async {
    if (!online) throw DioException.connectionError(requestOptions: options, reason: 'offline');
    requests.add(options);
    return ResponseBody.fromString('{"accepted":1}', 200, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late _FakeAdapter adapter;
  late SharedPreferences prefs;
  final usage = UsageService.instance;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
    adapter = _FakeAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'https://example.test'))..httpClientAdapter = adapter;
    usage.resetForTest();
    usage.installIdForTest = '0a1b2c3d4e5f6a7b';
    await usage.init(dio: dio, prefs: prefs, platformOverride: 'android');
  });

  Map<String, dynamic> body(RequestOptions r) => jsonDecode(r.data as String) as Map<String, dynamic>;

  test('drops events the server does not allow', () {
    usage.track('made_up_event');
    usage.track('scan_open');
    expect(usage.queuedCount, 1);
  });

  test('queues offline, keeps the queue, and sends it once online', () async {
    adapter.online = false;
    usage.track('scan_open');
    usage.track('feedback_open');
    await usage.flush();
    expect(usage.queuedCount, 2, reason: 'a failed flush must not lose events');

    adapter.online = true;
    await usage.flush();
    expect(usage.queuedCount, 0);
    expect(adapter.requests, hasLength(1));
    final sent = body(adapter.requests.single);
    expect(sent['iid'], '0a1b2c3d4e5f6a7b');
    expect((sent['events'] as List).map((e) => e['e']), ['scan_open', 'feedback_open']);
    expect(adapter.requests.single.headers['X-Platform'], 'android');
    expect(adapter.requests.single.headers['Content-Type'], 'text/plain');
  });

  test('survives an app restart (queue is persisted)', () async {
    adapter.online = false;
    usage.track('scan_open');
    final raw = prefs.getString('usage_queue_v1');
    expect(raw, isNotNull);
    expect(jsonDecode(raw!) as List, hasLength(1));
  });

  test('sends at most 50 events per request', () async {
    adapter.online = false;
    for (var i = 0; i < 120; i++) {
      usage.track('screen_view', screen: '/s$i');
    }
    adapter.online = true;
    await usage.flush();
    final sizes = adapter.requests.map((r) => (body(r)['events'] as List).length).toList();
    expect(sizes.every((n) => n <= 50), isTrue, reason: 'batches: $sizes');
    expect(sizes.fold<int>(0, (a, n) => a + n), 120, reason: 'nothing lost or duplicated');
    expect(usage.queuedCount, 0);
  });

  test('screen views use the route template and feed X-Source', () async {
    usage.screenView('/student/notes/:id');
    usage.screenView('/student/notes/:id'); // same screen again: no duplicate
    expect(usage.queuedCount, 1);
    expect(usage.currentSource, 'student.notes.:id');
    final h = await usage.clientHeaders();
    expect(h['X-Source'], 'student.notes.:id');
    expect(h['X-Device-ID'], '0a1b2c3d4e5f6a7b');
  });

  test('only team builds and emulators are tagged internal', () async {
    addTearDown(() => usage.internal = true);
    usage.internal = true;
    expect((await usage.clientHeaders())['X-Internal'], '1');
    usage.internal = false;
    expect((await usage.clientHeaders()).containsKey('X-Internal'), isFalse);
  });

  test('parses the Play install referrer', () {
    expect(UsageService.parseReferrer('utm_source=google-play&utm_medium=organic'),
        {'utm_source': 'google-play', 'utm_medium': 'organic'});
    expect(UsageService.parseReferrer('utm_source=pinterest&utm_campaign=herbst&gclid=x'),
        {'utm_source': 'pinterest', 'utm_campaign': 'herbst'});
    expect(UsageService.parseReferrer(''), isNull);
    expect(UsageService.parseReferrer('foo=bar'), isNull);
  });

  test('generated install ids match the server format', () {
    final id = UsageService.generateInstallId();
    expect(RegExp(r'^[0-9a-f]{16}$').hasMatch(id), isTrue);
  });
}
