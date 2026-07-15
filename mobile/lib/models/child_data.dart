class ChildQuickGrade {
  final String id;
  final String subjectId;
  final Map<String, dynamic> subjectNameMap;
  final String gradeValue;
  final String gradeQualityTier;
  final int bonusPoints;
  final String settlementStatus;
  final DateTime gradedAt;
  // 'notes' = quick-capture note; 'calculator' = saved term subject grade
  final String gradeSource;

  const ChildQuickGrade({
    required this.id,
    required this.subjectId,
    required this.subjectNameMap,
    required this.gradeValue,
    required this.gradeQualityTier,
    required this.bonusPoints,
    required this.settlementStatus,
    required this.gradedAt,
    this.gradeSource = 'notes',
  });

  String localizedName(String locale, {String fallback = ''}) {
    return (subjectNameMap[locale] ?? subjectNameMap['en'] ?? subjectNameMap['de'] ??
            subjectNameMap.values.firstOrNull ?? fallback)
        .toString();
  }

  String? get subjectName {
    final v = subjectNameMap['en'] ?? subjectNameMap['de'] ?? subjectNameMap.values.firstOrNull;
    return v?.toString();
  }

  factory ChildQuickGrade.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['subjectName'];
    Map<String, dynamic> nameMap = {};
    if (nameRaw is Map) {
      nameMap = Map<String, dynamic>.from(nameRaw);
    } else if (nameRaw is String && nameRaw.isNotEmpty) {
      nameMap = {'en': nameRaw};
    }
    return ChildQuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String? ?? '',
      subjectNameMap: nameMap,
      gradeValue: json['gradeValue'] as String? ?? '',
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: ((json['bonusPoints']) as num?)?.toInt() ?? 0,
      settlementStatus: json['settlementStatus'] as String? ?? 'unsettled',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
      gradeSource: json['gradeSource'] as String? ?? 'notes',
    );
  }
}

class ChildSubjectGrade {
  final String id;
  final String? subjectId;
  final Map<String, dynamic> subjectNameMap;
  final String? gradeValue;
  final String? gradeQualityTier;
  final int bonusPoints;
  final double weight;
  final double? gradeNormalized100;
  final String settlementStatus;

  const ChildSubjectGrade({
    required this.id,
    this.subjectId,
    required this.subjectNameMap,
    this.gradeValue,
    this.gradeQualityTier,
    required this.bonusPoints,
    this.weight = 1.0,
    this.gradeNormalized100,
    this.settlementStatus = 'unsettled',
  });

  String localizedName(String locale, {String fallback = ''}) {
    return (subjectNameMap[locale] ?? subjectNameMap['en'] ?? subjectNameMap['de'] ??
            subjectNameMap.values.firstOrNull ?? fallback)
        .toString();
  }

  String? get subjectName {
    final v = subjectNameMap['en'] ?? subjectNameMap['de'] ?? subjectNameMap.values.firstOrNull;
    return v?.toString();
  }

  factory ChildSubjectGrade.fromJson(Map<String, dynamic> json) {
    final subjectsRaw = json['subjects'] as Map<String, dynamic>?;
    Map<String, dynamic> nameMap = {};
    final nameRaw = subjectsRaw?['name'];
    if (nameRaw is Map) {
      nameMap = Map<String, dynamic>.from(nameRaw);
    } else if (nameRaw is String && nameRaw.isNotEmpty) {
      nameMap = {'en': nameRaw};
    }
    return ChildSubjectGrade(
      id: json['id'] as String,
      subjectId: (json['subject_id'] ?? json['subjectId']) as String?,
      subjectNameMap: nameMap,
      gradeValue: (json['grade_value'] ?? json['gradeValue']) as String?,
      gradeQualityTier: (json['grade_quality_tier'] ?? json['gradeQualityTier']) as String?,
      bonusPoints: ((json['bonus_points'] ?? json['bonusPoints']) as num?)?.toInt() ?? 0,
      weight: ((json['subject_weight'] ?? json['subjectWeight']) as num?)?.toDouble() ?? 1.0,
      gradeNormalized100:
          ((json['grade_normalized_100'] ?? json['gradeNormalized100']) as num?)?.toDouble(),
      settlementStatus: (json['settlement_status'] ?? json['settlementStatus']) as String? ?? 'unsettled',
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
  final String settlementStatus;
  final DateTime createdAt;
  final List<ChildSubjectGrade> subjects;

  // Grading system metadata
  final String? gradingSystemCode;
  final bool gradingSystemBestIsHighest;
  final String? gradingSystemScaleType;
  final double? gradingSystemMinValue;
  final double? gradingSystemMaxValue;
  final List<dynamic> gradingSystemDefinitions;

  const ChildTermResult({
    required this.id,
    required this.schoolYear,
    required this.termType,
    this.termName,
    required this.classLevel,
    required this.totalBonusPoints,
    this.settlementStatus = 'open',
    required this.createdAt,
    required this.subjects,
    this.gradingSystemCode,
    this.gradingSystemBestIsHighest = false,
    this.gradingSystemScaleType,
    this.gradingSystemMinValue,
    this.gradingSystemMaxValue,
    this.gradingSystemDefinitions = const [],
  });

  factory ChildTermResult.fromJson(Map<String, dynamic> json) {
    final subjectsRaw = (json['subject_grades'] ?? json['subjects']) as List<dynamic>? ?? [];
    final createdRaw = (json['created_at'] ?? json['createdAt']) as String?;

    final gs = json['grading_systems'] as Map<String, dynamic>?;
    final gsCode = (json['grading_system_code'] ?? gs?['code']) as String?;
    final gsBestIsHighest = (gs?['best_is_highest'] as bool?) ?? false;
    final gsScaleType = gs?['scale_type'] as String?;
    final gsMin = (gs?['min_value'] as num?)?.toDouble();
    final gsMax = (gs?['max_value'] as num?)?.toDouble();
    final gsDefs = (gs?['grade_definitions'] as List<dynamic>?) ?? [];

    return ChildTermResult(
      id: json['id'] as String,
      schoolYear: (json['school_year'] ?? json['schoolYear']) as String,
      termType: (json['term_type'] ?? json['termType']) as String,
      termName: (json['term_name'] ?? json['termName']) as String?,
      classLevel: ((json['class_level'] ?? json['classLevel']) as num?)?.toInt() ?? 1,
      totalBonusPoints:
          ((json['total_bonus_points'] ?? json['totalBonusPoints']) as num?)?.toInt() ?? 0,
      settlementStatus: (json['settlement_status'] ?? json['settlementStatus']) as String? ?? 'open',
      createdAt: createdRaw != null ? DateTime.parse(createdRaw) : DateTime.now(),
      subjects: subjectsRaw.map((s) => ChildSubjectGrade.fromJson(s as Map<String, dynamic>)).toList(),
      gradingSystemCode: gsCode,
      gradingSystemBestIsHighest: gsBestIsHighest,
      gradingSystemScaleType: gsScaleType,
      gradingSystemMinValue: gsMin,
      gradingSystemMaxValue: gsMax,
      gradingSystemDefinitions: gsDefs,
    );
  }

  String get rawDisplayLabel {
    if (termName != null && termName!.isNotEmpty) return termName!;
    return '$schoolYear · $termType';
  }

  double? get averageNormalized100 {
    final norms = subjects.map((s) => s.gradeNormalized100).whereType<double>().toList();
    if (norms.isEmpty) return null;
    return norms.reduce((a, b) => a + b) / norms.length;
  }

  String get tier {
    final avg = averageNormalized100;
    if (avg == null) return 'below';
    if (avg >= 80) return 'best';
    if (avg >= 60) return 'second';
    if (avg >= 40) return 'third';
    return 'below';
  }

  String get averagePrimary {
    final avg = averageNormalized100;
    if (avg == null) return '—';
    final scaleType = gradingSystemScaleType;
    if (scaleType == 'letter') return _nearestLetter(avg);
    if (scaleType == 'percentage') return '${avg.toStringAsFixed(0)}%';
    final min = gradingSystemMinValue ?? 1.0;
    final max = gradingSystemMaxValue ?? 6.0;
    final native = gradingSystemBestIsHighest
        ? min + (avg / 100) * (max - min)
        : max - (avg / 100) * (max - min);
    return native.toStringAsFixed(1);
  }

  String? get averageSecondary {
    if (gradingSystemCode != 'DE_GYMNASIUM') return null;
    final avg = averageNormalized100;
    if (avg == null) return null;
    final max = gradingSystemMaxValue ?? 15.0;
    final min = gradingSystemMinValue ?? 0.0;
    final points = min + (avg / 100) * (max - min);
    final de16 = ((17.0 - points) / 3.0).clamp(1.0, 6.0);
    return '≈ ${de16.toStringAsFixed(1)}';
  }

  String _nearestLetter(double normalizedAvg) {
    if (gradingSystemDefinitions.isEmpty) return '—';
    final defs = gradingSystemDefinitions.cast<Map<String, dynamic>>();
    return defs.reduce((closest, def) {
      final defNorm = (def['normalized_100'] as num?)?.toDouble() ?? 0.0;
      final closestNorm = (closest['normalized_100'] as num?)?.toDouble() ?? 0.0;
      return (defNorm - normalizedAvg).abs() < (closestNorm - normalizedAvg).abs() ? def : closest;
    })['grade'] as String? ?? '—';
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
