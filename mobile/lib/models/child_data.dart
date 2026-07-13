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
      subjectName =
          (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull)?.toString();
    }
    return ChildQuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: subjectName,
      gradeValue: json['gradeValue'] as String,
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: ((json['bonusPoints']) as num?)?.toInt() ?? 0,
      settlementStatus: json['settlementStatus'] as String? ?? 'unsettled',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
    );
  }
}

class ChildSubjectGrade {
  final String id;
  final String? subjectId;
  final String? subjectName;
  final String? gradeValue;
  final String? gradeQualityTier;
  final int bonusPoints;
  final double weight;

  const ChildSubjectGrade({
    required this.id,
    this.subjectId,
    this.subjectName,
    this.gradeValue,
    this.gradeQualityTier,
    required this.bonusPoints,
    this.weight = 1.0,
  });

  factory ChildSubjectGrade.fromJson(Map<String, dynamic> json) {
    final subjectsRaw = json['subjects'] as Map<String, dynamic>?;
    String? subjectName;
    final nameRaw = subjectsRaw?['name'];
    if (nameRaw is String) {
      subjectName = nameRaw;
    } else if (nameRaw is Map) {
      subjectName =
          (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull)?.toString();
    }
    return ChildSubjectGrade(
      id: json['id'] as String,
      subjectId: (json['subject_id'] ?? json['subjectId']) as String?,
      subjectName: subjectName,
      gradeValue: (json['grade_value'] ?? json['gradeValue']) as String?,
      gradeQualityTier:
          (json['grade_quality_tier'] ?? json['gradeQualityTier']) as String?,
      bonusPoints:
          ((json['bonus_points'] ?? json['bonusPoints']) as num?)?.toInt() ?? 0,
      weight:
          ((json['subject_weight'] ?? json['subjectWeight']) as num?)?.toDouble() ??
              1.0,
    );
  }
}

class ChildTermResult {
  final String id;
  final String schoolYear;
  final String termType;
  final String? termName;
  final int classLevel;
  final int totalBonusPoints;
  final DateTime createdAt;
  final List<ChildSubjectGrade> subjects;

  const ChildTermResult({
    required this.id,
    required this.schoolYear,
    required this.termType,
    this.termName,
    required this.classLevel,
    required this.totalBonusPoints,
    required this.createdAt,
    required this.subjects,
  });

  factory ChildTermResult.fromJson(Map<String, dynamic> json) {
    final subjectsRaw =
        (json['subject_grades'] ?? json['subjects']) as List<dynamic>? ?? [];
    final createdRaw =
        (json['created_at'] ?? json['createdAt']) as String?;
    return ChildTermResult(
      id: json['id'] as String,
      schoolYear: (json['school_year'] ?? json['schoolYear']) as String,
      termType: (json['term_type'] ?? json['termType']) as String,
      termName: (json['term_name'] ?? json['termName']) as String?,
      classLevel:
          ((json['class_level'] ?? json['classLevel']) as num?)?.toInt() ?? 1,
      totalBonusPoints:
          ((json['total_bonus_points'] ?? json['totalBonusPoints']) as num?)
                  ?.toInt() ??
              0,
      createdAt: createdRaw != null ? DateTime.parse(createdRaw) : DateTime.now(),
      subjects: subjectsRaw
          .map((s) => ChildSubjectGrade.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }

  // Returns termName when set; callers should use localizeTermLabel() /
  // localizeTermType() from term_type_utils.dart for widget display.
  String get rawDisplayLabel {
    if (termName != null && termName!.isNotEmpty) return termName!;
    return '$schoolYear · $termType';
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
