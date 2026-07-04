import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../client.dart';

String _serverError(DioException e, String fallback) {
  final data = e.response?.data;
  if (data is Map) return (data['error'] ?? data['message'] ?? fallback).toString();
  return fallback;
}

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(apiClientProvider), const FlutterSecureStorage());
});

class AuthSessionState {
  final bool isAuthenticated;
  final String? userId;
  final String? role;
  final String? name;
  final String? email;

  const AuthSessionState({
    required this.isAuthenticated,
    this.userId,
    this.role,
    this.name,
    this.email,
  });

  factory AuthSessionState.unauthenticated() =>
      const AuthSessionState(isAuthenticated: false);
}

class AuthService {
  final ApiClient _client;
  final FlutterSecureStorage _storage;

  AuthService(this._client, this._storage);

  Future<AuthSessionState> restoreSession() async {
    final token = await _storage.read(key: AppConstants.keyAccessToken);
    if (token == null) return AuthSessionState.unauthenticated();

    try {
      final resp = await _client.get('/api/mobile/auth/me');
      return AuthSessionState(
        isAuthenticated: true,
        userId: resp.data['id'] as String?,
        role: resp.data['role'] as String?,
        name: resp.data['name'] as String?,
        email: resp.data['email'] as String?,
      );
    } catch (_) {
      await _storage.deleteAll();
      return AuthSessionState.unauthenticated();
    }
  }

  Future<AuthSessionState> login({
    required String email,
    required String password,
  }) async {
    try {
      final resp = await _client.post('/api/mobile/auth/signin', data: {
        'email': email,
        'password': password,
      });

      final token = resp.data['accessToken'] as String?;
      if (token == null) throw Exception('No access token in response');

      await _storage.write(key: AppConstants.keyAccessToken, value: token);

      return AuthSessionState(
        isAuthenticated: true,
        userId: resp.data['user']?['id'] as String?,
        role: resp.data['user']?['role'] as String?,
        name: resp.data['user']?['name'] as String?,
        email: resp.data['user']?['email'] as String?,
      );
    } on DioException catch (e) {
      throw Exception(_serverError(e, 'Invalid email or password'));
    }
  }

  Future<({String userId, String email})> register({
    required String email,
    required String password,
    required String fullName,
    required String dateOfBirth,
    required String role,
    String? turnstileToken,
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'password': password,
      'fullName': fullName,
      'dateOfBirth': dateOfBirth,
      'role': role,
    };
    if (turnstileToken != null) body['turnstileToken'] = turnstileToken;

    final resp = await _client.post('/api/auth/register', data: body);
    return (
      userId: resp.data['userId'] as String,
      email: resp.data['email'] as String,
    );
  }

  Future<void> verifyEmail({
    required String userId,
    required String code,
    String purpose = 'email_verification',
  }) async {
    await _client.post('/api/auth/verify-email', data: {
      'userId': userId,
      'code': code,
      'purpose': purpose,
    });
  }

  Future<void> forgotPassword({required String email}) async {
    await _client.post('/api/auth/forgot-password', data: {'email': email});
  }

  Future<void> logout() async {
    try {
      await _client.post('/api/auth/signout', data: {});
    } catch (_) {}
    await _storage.deleteAll();
  }
}
