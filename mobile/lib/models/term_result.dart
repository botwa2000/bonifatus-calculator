class SubjectResult {
  final String subjectId;
  final String? subjectName;
  final String gradeValue;
  final int bonusPoints;
  final String? gradeQualityTier;

  const SubjectResult({
    required this.subjectId,
    this.subjectName,
    required this.gradeValue,
    required this.bonusPoints,
    this.gradeQualityTier,
  });

  factory SubjectResult.fromJson(Map<String, dynamic> json) {
    return SubjectResult(
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      gradeValue: json['gradeValue'] as String,
      bonusPoints: json['bonusPoints'] as int? ?? 0,
      gradeQualityTier: json['gradeQualityTier'] as String?,
    );
  }
}

class TermResult {
  final String id;
  final String schoolYear;
  final String termType;
  final int classLevel;
  final int totalBonusPoints;
  final String status;
  final String? termName;
  final DateTime createdAt;
  final List<SubjectResult> subjects;

  const TermResult({
    required this.id,
    required this.schoolYear,
    required this.termType,
    required this.classLevel,
    required this.totalBonusPoints,
    required this.status,
    this.termName,
    required this.createdAt,
    required this.subjects,
  });

  factory TermResult.fromJson(Map<String, dynamic> json) {
    return TermResult(
      id: json['id'] as String,
      schoolYear: json['schoolYear'] as String,
      termType: json['termType'] as String,
      classLevel: json['classLevel'] as int? ?? 1,
      totalBonusPoints: json['totalBonusPoints'] as int? ?? 0,
      status: json['status'] as String? ?? 'active',
      termName: json['termName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      subjects: (json['subjects'] as List<dynamic>? ?? [])
          .map((s) => SubjectResult.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }

  String get displayLabel {
    if (termName != null && termName!.isNotEmpty) return termName!;
    return '$schoolYear $termType';
  }

  double? get averageGrade {
    if (subjects.isEmpty) return null;
    final grades = subjects
        .map((s) => double.tryParse(s.gradeValue))
        .whereType<double>()
        .toList();
    if (grades.isEmpty) return null;
    return grades.reduce((a, b) => a + b) / grades.length;
  }

  String get tier {
    final avg = averageGrade;
    if (avg == null) return 'below';
    if (avg < 1.5) return 'best';
    if (avg < 2.5) return 'second';
    if (avg < 3.5) return 'third';
    return 'below';
  }
}
