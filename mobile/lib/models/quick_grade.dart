class QuickGrade {
  final String id;
  final String subjectId;
  final String? subjectName;
  final String gradeValue;
  final String gradeQualityTier;
  final double bonusPoints;
  final String settlementStatus;
  final DateTime gradedAt;

  const QuickGrade({
    required this.id,
    required this.subjectId,
    this.subjectName,
    required this.gradeValue,
    required this.gradeQualityTier,
    required this.bonusPoints,
    required this.settlementStatus,
    required this.gradedAt,
  });

  factory QuickGrade.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['subjectName'];
    String? subjectName;
    if (nameRaw is String) {
      subjectName = nameRaw;
    } else if (nameRaw is Map) {
      subjectName = (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull)?.toString();
    }
    return QuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: subjectName,
      gradeValue: json['gradeValue'] as String,
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: ((json['bonusPoints']) as num?)?.toDouble() ?? 0.0,
      settlementStatus: json['settlementStatus'] as String? ?? 'pending',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
    );
  }
}
