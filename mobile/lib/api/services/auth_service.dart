import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../client.dart';

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
      final resp = await _client.get('/api/auth/me');
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
    final resp = await _client.post('/api/auth/signin', data: {
      'email': email,
      'password': password,
    });

    final token = resp.data['accessToken'] as String?;
    final refreshToken = resp.data['refreshToken'] as String?;
    if (token == null) throw Exception('No access token in response');

    await _storage.write(key: AppConstants.keyAccessToken, value: token);
    if (refreshToken != null) {
      await _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken);
    }

    return AuthSessionState(
      isAuthenticated: true,
      userId: resp.data['user']?['id'] as String?,
      role: resp.data['user']?['role'] as String?,
      name: resp.data['user']?['name'] as String?,
      email: resp.data['user']?['email'] as String?,
    );
  }

  Future<void> logout() async {
    try {
      await _client.post('/api/auth/signout', data: {});
    } catch (_) {}
    await _storage.deleteAll();
  }
}
