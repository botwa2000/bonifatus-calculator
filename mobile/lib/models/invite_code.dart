class InviteCode {
  final String id;
  final String code;
  final DateTime expiresAt;
  final String status;

  const InviteCode({
    required this.id,
    required this.code,
    required this.expiresAt,
    required this.status,
  });

  factory InviteCode.fromJson(Map<String, dynamic> json) {
    return InviteCode(
      id: json['id'] as String,
      code: json['code'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      status: json['status'] as String? ?? 'active',
    );
  }
}
