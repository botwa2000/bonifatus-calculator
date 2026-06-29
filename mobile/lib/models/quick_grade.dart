class QuickGrade {
  final String id;
  final String subjectId;
  final String? subjectName;
  final String gradeValue;
  final String gradeQualityTier;
  final int bonusPoints;
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
    return QuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      gradeValue: json['gradeValue'] as String,
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: json['bonusPoints'] as int? ?? 0,
      settlementStatus: json['settlementStatus'] as String? ?? 'pending',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
    );
  }
}
