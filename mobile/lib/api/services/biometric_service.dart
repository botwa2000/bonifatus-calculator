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
    final value = await _storage.read(key: AppConstants.keyBiometricEnabled);
    return value == 'true';
  }

  Future<void> setEnabled(bool enabled) async {
    if (enabled) {
      await _storage.write(
        key: AppConstants.keyBiometricEnabled,
        value: 'true',
      );
    } else {
      await _storage.delete(key: AppConstants.keyBiometricEnabled);
    }
  }

  Future<bool> authenticate({String reason = 'Sign in to Bonifatus'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (_) {
      return false;
    }
  }
}
