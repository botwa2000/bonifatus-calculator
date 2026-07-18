import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/app_constants.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const _appSecret = String.fromEnvironment(
    'MOBILE_APP_SECRET',
    defaultValue: '',
  );

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));
    _dio.interceptors.add(_AuthInterceptor(_storage));
    _dio.interceptors.add(_MobileTokenInterceptor(_appSecret));
    _dio.interceptors.add(LogInterceptor(requestBody: false, responseBody: false));
  }

  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  Future<Response> put(String path, {dynamic data}) =>
      _dio.put(path, data: data);

  Future<Response> patch(String path, {dynamic data}) =>
      _dio.patch(path, data: data);

  Future<Response> delete(String path, {dynamic data}) =>
      _dio.delete(path, data: data);
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      final token = await _storage.read(key: AppConstants.keyAccessToken);
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    } on PlatformException catch (_) {
      // Android Keystore key was invalidated (app reinstall / backup restore).
      // Wipe all corrupted entries — the user will land on the login screen.
      try { await _storage.deleteAll(); } catch (_) {}
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final path = err.requestOptions.path;
      // Clear session on 401 from any mobile-authenticated endpoint.
      // Public auth endpoints (signin, google) may legitimately return 401 for wrong credentials
      // — don't clear those. Web API routes are excluded because they use a separate auth system.
      final isPublicAuthEndpoint = path.contains('/api/mobile/auth/signin') ||
          path.contains('/api/mobile/auth/google');
      if (path.contains('/api/mobile/') && !isPublicAuthEndpoint) {
        await Future.wait([
          _storage.delete(key: AppConstants.keyAccessToken),
          _storage.delete(key: AppConstants.keyBiometricJwt),
        ]);
      }
    }
    handler.next(err);
  }
}

class _MobileTokenInterceptor extends Interceptor {
  final String _secret;
  _MobileTokenInterceptor(this._secret);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final storage = const FlutterSecureStorage();
    final deviceId = await _getOrCreateDeviceId(storage);
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final path = options.path;
    final payload = '$deviceId:$timestamp:$path';
    final key = utf8.encode(_secret);
    final bytes = utf8.encode(payload);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    options.headers['X-Mobile-Client-Token'] = '${digest.toString()}:$timestamp:$deviceId';
    handler.next(options);
  }

  Future<String> _getOrCreateDeviceId(FlutterSecureStorage storage) async {
    try {
      var id = await storage.read(key: AppConstants.keyDeviceId);
      if (id == null) {
        id = _generateDeviceId();
        await storage.write(key: AppConstants.keyDeviceId, value: id);
      }
      return id;
    } on PlatformException catch (_) {
      return _generateDeviceId();
    }
  }

  String _generateDeviceId() {
    final rng = Random.secure();
    final bytes = List<int>.generate(8, (_) => rng.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
