import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../client.dart';
import '../../models/child_data.dart';
import '../../models/invite_code.dart';

/// Why redeeming an invite code failed (server `errorCode`, see /api/connections/redeem).
enum RedeemFailure { invalid, used, revoked, expired, rateLimited, busy, network, server }

class RedeemException implements Exception {
  final RedeemFailure reason;
  /// With [RedeemFailure.rateLimited]: how long until the next attempt is allowed.
  final Duration? retryAfter;
  const RedeemException(this.reason, {this.retryAfter});
  @override
  String toString() => 'RedeemException(${reason.name})';
}

RedeemException _redeemFailure(DioException e) {
  final data = e.response?.data;
  if (e.response == null) return const RedeemException(RedeemFailure.network);
  final code = data is Map ? data['errorCode'] : null;
  final retry = data is Map ? data['retryAfterSeconds'] : null;
  return switch (code) {
    'invalid' => const RedeemException(RedeemFailure.invalid),
    'used' => const RedeemException(RedeemFailure.used),
    'revoked' => const RedeemException(RedeemFailure.revoked),
    'expired' => const RedeemException(RedeemFailure.expired),
    'rate_limited' => RedeemException(RedeemFailure.rateLimited,
        retryAfter: retry is num ? Duration(seconds: retry.toInt()) : null),
    'busy' => const RedeemException(RedeemFailure.busy),
    _ => const RedeemException(RedeemFailure.server),
  };
}

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

  /// The parent's live invite (the server reuses it), or with [replace] a fresh one
  /// that revokes the old code.
  Future<InviteCode> createInvite({bool replace = false}) async {
    final resp = await _client.post('/api/connections/invite', data: {'replace': replace});
    final invite = resp.data['invite'] as Map<String, dynamic>;
    return InviteCode.fromJson(invite);
  }

  /// Cancels a pending invite; its code stops working at once.
  Future<void> revokeInvite(String inviteId) async {
    await _client.post('/api/connections/invite/revoke', data: {'inviteId': inviteId});
  }

  /// Throws [RedeemException] with the reason the child should see.
  Future<String> redeemCode(String code) async {
    try {
      final resp = await _client.post('/api/connections/redeem', data: {'code': code});
      return resp.data['relationshipId'] as String;
    } on DioException catch (e) {
      throw _redeemFailure(e);
    }
  }

  Future<void> removeConnection(String relationshipId) async {
    await _client.post('/api/connections/remove', data: {'relationshipId': relationshipId});
  }

  Future<List<Map<String, dynamic>>> fetchParentConnections() async {
    final resp = await _client.get('/api/connections/list');
    final asChild = resp.data['asChild'] as List<dynamic>? ?? [];
    return asChild.cast<Map<String, dynamic>>();
  }

  Future<Map<String, double>> fetchBonusFactors() async {
    final resp = await _client.get('/api/settings/factors');
    final defaults = resp.data['defaults'] as List<dynamic>? ?? [];
    final overrides = resp.data['overrides'] as List<dynamic>? ?? [];
    final result = <String, double>{};
    for (final f in [...defaults, ...overrides]) {
      final m = f as Map<String, dynamic>;
      if (m['factorType'] == 'grade_tier') {
        result[m['factorKey'] as String] = (m['factorValue'] as num).toDouble();
      }
    }
    return result;
  }

  Future<void> saveBonusFactors(Map<String, double> tierFactors) async {
    final factors = tierFactors.entries
        .map((e) => {'factorType': 'grade_tier', 'factorKey': e.key, 'factorValue': e.value})
        .toList();
    await _client.put('/api/settings/factors', data: {'factors': factors});
  }

  Future<List<ChildProfile>> fetchChildProfiles() async {
    final resp = await _client.get('/api/parent/children/profiles');
    final children = resp.data['children'] as List<dynamic>? ?? [];
    return children
        .map((c) => ChildProfile.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChildTermResult>> fetchChildTermResults(String childId) async {
    final resp = await _client.get('/api/parent/children/grades');
    final children = resp.data['children'] as List<dynamic>? ?? [];
    for (final c in children) {
      final childObj = c['child'] as Map<String, dynamic>?;
      final id = childObj?['id'] as String?;
      if (id == childId) {
        final terms = c['terms'] as List<dynamic>? ?? [];
        return terms
            .map((t) => ChildTermResult.fromJson(t as Map<String, dynamic>))
            .toList()
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      }
    }
    return [];
  }
}
