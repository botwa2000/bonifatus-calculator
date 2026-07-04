import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/auth_service.dart';

// Re-export AuthSessionState under the shorter name used throughout the app
typedef AuthState = AuthSessionState;

class AuthStateNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    if (kIsWeb && kDebugMode) {
      return const AuthState(
        isAuthenticated: true,
        userId: 'demo-parent-id',
        role: 'parent',
        name: 'Alexander Perel',
        email: 'alexander.perel@gmail.com',
      );
    }
    final service = ref.read(authServiceProvider);
    return service.restoreSession();
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final service = ref.read(authServiceProvider);
      return service.login(email: email, password: password);
    });
  }

  Future<void> logout() async {
    final service = ref.read(authServiceProvider);
    await service.logout();
    state = AsyncValue.data(AuthState.unauthenticated());
  }

  Future<void> loginWithBiometrics() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final service = ref.read(authServiceProvider);
      final session = await service.restoreSession();
      if (!session.isAuthenticated) throw Exception('Session expired. Please sign in with your password.');
      return session;
    });
  }

  Future<void> deleteAccount() async {
    state = const AsyncValue.loading();
    final service = ref.read(authServiceProvider);
    await service.deleteAccount();
    state = AsyncValue.data(AuthState.unauthenticated());
  }
}

final authStateNotifierProvider =
    AsyncNotifierProvider<AuthStateNotifier, AuthState>(AuthStateNotifier.new);
