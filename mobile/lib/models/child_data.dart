class ChildQuickGrade {
  final String id;
  final String subjectId;
  final String? subjectName;
  final String gradeValue;
  final String gradeQualityTier;
  final int bonusPoints;
  final String settlementStatus;
  final DateTime gradedAt;

  const ChildQuickGrade({
    required this.id,
    required this.subjectId,
    this.subjectName,
    required this.gradeValue,
    required this.gradeQualityTier,
    required this.bonusPoints,
    required this.settlementStatus,
    required this.gradedAt,
  });

  factory ChildQuickGrade.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['subjectName'];
    String? subjectName;
    if (nameRaw is String) {
      subjectName = nameRaw;
    } else if (nameRaw is Map) {
      subjectName = (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull)?.toString();
    }
    return ChildQuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: subjectName,
      gradeValue: json['gradeValue'] as String,
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: json['bonusPoints'] as int? ?? 0,
      settlementStatus: json['settlementStatus'] as String? ?? 'unsettled',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
    );
  }
}

class ChildWithGrades {
  final String childId;
  final String childName;
  final List<ChildQuickGrade> grades;

  const ChildWithGrades({
    required this.childId,
    required this.childName,
    required this.grades,
  });

  factory ChildWithGrades.fromJson(Map<String, dynamic> json) {
    return ChildWithGrades(
      childId: json['childId'] as String,
      childName: json['childName'] as String,
      grades: (json['grades'] as List<dynamic>? ?? [])
          .map((g) => ChildQuickGrade.fromJson(g as Map<String, dynamic>))
          .toList(),
    );
  }

  int get totalPendingPoints => grades
      .where((g) => g.settlementStatus == 'unsettled')
      .fold(0, (sum, g) => sum + g.bonusPoints);

  String get latestTier {
    if (grades.isEmpty) return 'below';
    final sorted = [...grades]..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    return sorted.first.gradeQualityTier;
  }
}
