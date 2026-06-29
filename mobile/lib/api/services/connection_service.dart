import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../client.dart';
import '../../models/child_data.dart';
import '../../models/invite_code.dart';

final connectionServiceProvider = Provider<ConnectionService>((ref) {
  return ConnectionService(ref.read(apiClientProvider));
});

class ConnectionService {
  final ApiClient _client;
  ConnectionService(this._client);

  Future<List<ChildWithGrades>> fetchChildrenQuickGrades() async {
    final resp = await _client.get('/api/parent/children/quick-grades');
    final children = resp.data['children'] as List<dynamic>? ?? [];
    return children
        .map((c) => ChildWithGrades.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  Future<List<Map<String, dynamic>>> fetchConnectionsList() async {
    final resp = await _client.get('/api/connections/list');
    final asParent = resp.data['asParent'] as List<dynamic>? ?? [];
    return asParent.cast<Map<String, dynamic>>();
  }

  Future<InviteCode> createInvite() async {
    final resp = await _client.post('/api/connections/invite', data: {});
    final invite = resp.data['invite'] as Map<String, dynamic>;
    return InviteCode.fromJson(invite);
  }

  Future<String> redeemCode(String code) async {
    final resp =
        await _client.post('/api/connections/redeem', data: {'code': code});
    return resp.data['relationshipId'] as String;
  }
}
