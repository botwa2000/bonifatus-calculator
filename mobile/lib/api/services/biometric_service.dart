import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService(LocalAuthentication(), const FlutterSecureStorage());
});

class BiometricService {
  final LocalAuthentication _auth;
  final FlutterSecureStorage _storage;

  BiometricService(this._auth, this._storage);

  Future<bool> canAuthenticate() async {
    try {
      if (!await _auth.isDeviceSupported()) return false;
      return await _auth.canCheckBiometrics;
    } catch (_) {
      return false;
    }
  }

  Future<bool> isEnabled() async {
    try {
      final value = await _storage.read(key: AppConstants.keyBiometricEnabled);
      return value == 'true';
    } on PlatformException catch (_) {
      return false;
    }
  }

  Future<void> setEnabled(bool enabled) async {
    if (enabled) {
      await _storage.write(key: AppConstants.keyBiometricEnabled, value: 'true');
      try {
        final token = await _storage.read(key: AppConstants.keyAccessToken);
        if (token != null && token.isNotEmpty) {
          await _storage.write(key: AppConstants.keyBiometricJwt, value: token);
        }
      } on PlatformException catch (_) {}
    } else {
      await _storage.delete(key: AppConstants.keyBiometricEnabled);
      await _storage.delete(key: AppConstants.keyBiometricJwt);
    }
  }

  Future<bool> authenticate({String reason = 'Sign in to Bonifatus'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        biometricOnly: true,
      );
    } catch (_) {
      return false;
    }
  }
}
