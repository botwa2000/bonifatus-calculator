import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:play_install_referrer/play_install_referrer.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';

/// First-party usage statistics → POST /api/t on our own server (never a third
/// party). Powers the confidential /admin/stats dashboard.
///
/// Privacy: the only identifier is the random per-install ID the app already
/// sends with every request (no advertising ID, no device data). Events and
/// their props are allow-listed on the server, so no free text can be stored.
///
/// Events are queued in SharedPreferences, so they survive offline use and app
/// kills, and are sent in batches when the app goes to the background, when the
/// queue grows, or on the next start.
class UsageService with WidgetsBindingObserver {
  UsageService._();

  static final UsageService instance = UsageService._();

  static const _queueKey = 'usage_queue_v1';
  static const _referrerDoneKey = 'usage_referrer_done';
  static const _maxQueued = 500;
  static const _flushAt = 20;

  /// Server allow-list (lib/stats/usage.ts EVENTS). Anything else is dropped here.
  static const events = {
    'app_open',
    'screen_view',
    'calculator_result',
    'scan_open',
    'scan_result',
    'invite_open',
    'invite_share',
    'review_prompt',
    'review_store_open',
    'feedback_open',
    'signup_start',
    'error',
  };

  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  Dio? _dio;
  SharedPreferences? _prefs;
  String? _installId;
  String _version = '';
  String _platform = 'app';
  Future<void>? _inflight;

  /// Route template of the visible screen (e.g. /student/notes/:id).
  String? currentScreen;

  /// `X-Source` value for API calls: the screen the action was started from.
  String? get currentSource {
    final s = currentScreen;
    if (s == null) return null;
    final v = s.replaceAll(RegExp(r'^/+'), '').replaceAll('/', '.').replaceAll(RegExp(r'[^a-z0-9_.:-]'), '');
    return v.isEmpty ? null : (v.length > 40 ? v.substring(0, 40) : v);
  }

  String get platform => _platform;
  String get version => _version;

  /// Must run before the first API call (main.dart).
  Future<void> init({Dio? dio, SharedPreferences? prefs, String? platformOverride}) async {
    _prefs = prefs ?? await SharedPreferences.getInstance();
    _platform = platformOverride ??
        (kIsWeb ? 'web' : Platform.isIOS ? 'ios' : Platform.isAndroid ? 'android' : 'app');
    try {
      final info = await PackageInfo.fromPlatform();
      _version = info.buildNumber.isEmpty ? info.version : '${info.version}+${info.buildNumber}';
    } catch (_) {}
    _dio = dio ??
        Dio(BaseOptions(
          baseUrl: AppConstants.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ));
    WidgetsBinding.instance.addObserver(this);
  }

  /// The random install ID shared with the request signer (X-Mobile-Client-Token).
  Future<String> installId() async {
    final cached = _installId;
    if (cached != null) return cached;
    try {
      var id = await _secure.read(key: AppConstants.keyDeviceId);
      if (id == null) {
        id = generateInstallId();
        await _secure.write(key: AppConstants.keyDeviceId, value: id);
      }
      return _installId = id;
    } on PlatformException catch (_) {
      return _installId = generateInstallId();
    }
  }

  static String generateInstallId() {
    final rng = Random.secure();
    return List<int>.generate(8, (_) => rng.nextInt(256)).map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  /// Headers every API call carries so the server knows platform, version and install.
  Future<Map<String, String>> clientHeaders() async => {
        'X-Platform': _platform,
        if (_version.isNotEmpty) 'X-App-Version': _version,
        'X-Device-ID': await installId(),
        'X-App-Lang': PlatformDispatcher.instance.locale.languageCode,
        'X-Source': ?currentSource,
      };

  /// Queue one event. Unknown names are ignored (the server would drop them too).
  void track(String event, {String? screen, Map<String, Object>? props}) {
    if (!events.contains(event)) return;
    final prefs = _prefs;
    if (prefs == null) return;
    final queue = _readQueue(prefs);
    queue.add({
      'e': event,
      if ((screen ?? currentScreen) != null) 's': screen ?? currentScreen,
      if (props != null && props.isNotEmpty) 'p': props,
      't': DateTime.now().millisecondsSinceEpoch,
    });
    // Bounded: a device offline for weeks keeps the newest events only.
    final trimmed = queue.length > _maxQueued ? queue.sublist(queue.length - _maxQueued) : queue;
    prefs.setString(_queueKey, jsonEncode(trimmed));
    if (trimmed.length >= _flushAt) flush();
  }

  void screenView(String template) {
    if (template.isEmpty || template == currentScreen) return;
    currentScreen = template;
    track('screen_view', screen: template);
  }

  /// Cold start: app_open, plus the Play Install Referrer once per install.
  Future<void> appStarted() async {
    final acq = await _firstOpenReferrer();
    track('app_open');
    await flush(acquisition: acq);
  }

  int get queuedCount => _prefs == null ? 0 : _readQueue(_prefs!).length;

  /// Send queued events (max 50 per request, as the server accepts). A call
  /// made while a flush is running waits for it, then sends whatever is left.
  Future<void> flush({Map<String, String>? acquisition}) async {
    while (_inflight != null) {
      await _inflight;
    }
    final run = _send(acquisition);
    _inflight = run;
    try {
      await run;
    } finally {
      if (identical(_inflight, run)) _inflight = null;
    }
  }

  Future<void> _send(Map<String, String>? acquisition) async {
    final prefs = _prefs;
    final dio = _dio;
    if (prefs == null || dio == null) return;
    try {
      var acq = acquisition;
      while (true) {
        final queue = _readQueue(prefs);
        if (queue.isEmpty) break;
        final batch = queue.take(50).toList();
        await dio.post(
          '/api/t',
          data: jsonEncode({
            'iid': await installId(),
            'v': _version,
            'lang': PlatformDispatcher.instance.locale.languageCode,
            if (acq != null && acq.isNotEmpty) 'acq': acq,
            'events': batch,
          }),
          options: Options(headers: {...await clientHeaders(), 'Content-Type': 'text/plain'}),
        );
        acq = null;
        // Remove only what was sent; events tracked meanwhile stay queued.
        final now = _readQueue(prefs);
        await prefs.setString(_queueKey, jsonEncode(now.skip(batch.length).toList()));
      }
    } catch (e) {
      // Offline or server error: keep the queue, retry on the next flush.
      if (kDebugMode) debugPrint('[Usage] flush failed: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.hidden) {
      flush();
    } else if (state == AppLifecycleState.resumed) {
      track('app_open', props: {'mode': 'resume'});
    }
  }

  List<Map<String, dynamic>> _readQueue(SharedPreferences prefs) {
    try {
      final raw = prefs.getString(_queueKey);
      if (raw == null) return [];
      return (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  /// Android only, first open only: where the install came from
  /// (utm_source / utm_medium / utm_campaign of the Play Store link).
  Future<Map<String, String>?> _firstOpenReferrer() async {
    final prefs = _prefs;
    if (prefs == null || _platform != 'android' || (prefs.getBool(_referrerDoneKey) ?? false)) return null;
    try {
      final details = await PlayInstallReferrer.installReferrer;
      await prefs.setBool(_referrerDoneKey, true);
      return parseReferrer(details.installReferrer);
    } catch (_) {
      return null; // Play services unavailable: try again next start
    }
  }

  /// "utm_source=google-play&utm_medium=organic" → {utm_source: google-play, ...}
  static Map<String, String>? parseReferrer(String? referrer) {
    if (referrer == null || referrer.isEmpty) return null;
    final params = Uri.splitQueryString(referrer);
    final out = <String, String>{
      for (final k in const ['utm_source', 'utm_medium', 'utm_campaign'])
        if ((params[k] ?? '').isNotEmpty) k: params[k]!,
    };
    return out.isEmpty ? null : out;
  }

  @visibleForTesting
  void resetForTest() {
    _prefs = null;
    _dio = null;
    _installId = null;
    currentScreen = null;
    _inflight = null;
  }

  @visibleForTesting
  set installIdForTest(String id) => _installId = id;
}
