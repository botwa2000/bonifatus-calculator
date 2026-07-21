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

  Future<void> updateProfile({
    String? fullName,
    String? schoolName,
    String? schoolTown,
    int? semesterCount,
    int? programLength,
    String? defaultGradingSystemId,
    int? defaultClassLevel,
  }) async {
    final data = <String, dynamic>{};
    if (fullName != null) data['fullName'] = fullName;
    if (schoolName != null) data['schoolName'] = schoolName;
    if (schoolTown != null) data['schoolTown'] = schoolTown;
    if (semesterCount != null) data['semesterCount'] = semesterCount;
    if (programLength != null) data['programLength'] = programLength;
    if (defaultGradingSystemId != null) data['defaultGradingSystemId'] = defaultGradingSystemId;
    if (defaultClassLevel != null) data['defaultClassLevel'] = defaultClassLevel;
    await _client.post('/api/profile/update', data: data);
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    await _client.post('/api/profile/password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> requestEmailChange({required String newEmail}) async {
    await _client.post('/api/profile/change-email/request', data: {'newEmail': newEmail});
  }

  Future<void> verifyEmailChange({required String code}) async {
    await _client.post('/api/profile/change-email/verify', data: {'code': code});
  }
}
