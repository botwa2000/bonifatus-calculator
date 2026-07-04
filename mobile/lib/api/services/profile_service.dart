import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../client.dart';

final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.read(apiClientProvider));
});

class ProfileService {
  final ApiClient _client;
  ProfileService(this._client);

  Future<Map<String, dynamic>> fetchProfile() async {
    final resp = await _client.get('/api/profile/update');
    return (resp.data['profile'] as Map<String, dynamic>?) ?? {};
  }

  Future<void> updateProfile({required String fullName}) async {
    await _client.post('/api/profile/update', data: {'fullName': fullName});
  }

  Future<void> changePassword({required String newPassword}) async {
    await _client.post('/api/profile/password', data: {'newPassword': newPassword});
  }

  Future<void> requestEmailChange({required String newEmail}) async {
    await _client.post('/api/profile/change-email/request', data: {'newEmail': newEmail});
  }

  Future<void> verifyEmailChange({required String code}) async {
    await _client.post('/api/profile/change-email/verify', data: {'code': code});
  }
}
