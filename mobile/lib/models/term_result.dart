class SubjectResult {
  final String subjectId;
  final String? subjectName;
  final String gradeValue;
  final double bonusPoints;
  final String? gradeQualityTier;

  const SubjectResult({
    required this.subjectId,
    this.subjectName,
    required this.gradeValue,
    required this.bonusPoints,
    this.gradeQualityTier,
  });

  factory SubjectResult.fromJson(Map<String, dynamic> json) {
    // API returns snake_case; support both
    final subjectId = (json['subjectId'] ?? json['subject_id']) as String;
    final gradeValue = (json['gradeValue'] ?? json['grade_value'] ?? json['grade']) as String? ?? '';
    final bonusPoints = ((json['bonusPoints'] ?? json['bonus_points']) as num?)?.toDouble() ?? 0.0;
    final tier = (json['gradeQualityTier'] ?? json['grade_quality_tier']) as String?;
    // subjectName may be nested under subjects.name (JSONB)
    String? subjectName = (json['subjectName'] ?? json['subject_name']) as String?;
    if (subjectName == null) {
      final nested = json['subjects'] as Map<String, dynamic>?;
      final nameRaw = nested?['name'];
      if (nameRaw is String) {
        subjectName = nameRaw;
      } else if (nameRaw is Map) {
        subjectName = (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull)?.toString();
      }
    }
    return SubjectResult(
      subjectId: subjectId,
      subjectName: subjectName,
      gradeValue: gradeValue,
      bonusPoints: bonusPoints,
      gradeQualityTier: tier,
    );
  }
}

class TermResult {
  final String id;
  final String schoolYear;
  final String termType;
  final int classLevel;
  final double totalBonusPoints;
  final String status;
  final String? termName;
  final String? gradingSystemId;
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
    this.gradingSystemId,
    required this.createdAt,
    required this.subjects,
  });

  factory TermResult.fromJson(Map<String, dynamic> json) {
    // API returns snake_case; support both
    final subjectsRaw =
        (json['subjects'] ?? json['subject_grades']) as List<dynamic>? ?? [];
    final createdRaw = (json['createdAt'] ?? json['created_at']) as String?;
    return TermResult(
      id: json['id'] as String,
      schoolYear: (json['schoolYear'] ?? json['school_year']) as String,
      termType: (json['termType'] ?? json['term_type']) as String,
      classLevel: (json['classLevel'] ?? json['class_level']) as int? ?? 1,
      totalBonusPoints:
          ((json['totalBonusPoints'] ?? json['total_bonus_points']) as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'active',
      termName: (json['termName'] ?? json['term_name']) as String?,
      gradingSystemId: (json['gradingSystemId'] ?? json['grading_system_id']) as String?,
      createdAt: createdRaw != null ? DateTime.parse(createdRaw) : DateTime.now(),
      subjects: subjectsRaw
          .map((s) => SubjectResult.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }

  // Returns termName when set; callers should use localizeTermLabel() from
  // term_type_utils.dart for widget display so the term type is localized.
  String get rawDisplayLabel {
    if (termName != null && termName!.isNotEmpty) return termName!;
    return '$schoolYear · $termType';
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
