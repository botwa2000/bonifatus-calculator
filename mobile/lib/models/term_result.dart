class SubjectResult {
  final String subjectId;
  final Map<String, dynamic> subjectNameMap;
  final String gradeValue;
  final double? gradeNormalized100;
  final double bonusPoints;
  final String? gradeQualityTier;
  final String settlementStatus;
  final double weight;

  const SubjectResult({
    required this.subjectId,
    required this.subjectNameMap,
    required this.gradeValue,
    this.gradeNormalized100,
    required this.bonusPoints,
    this.gradeQualityTier,
    this.settlementStatus = 'unsettled',
    this.weight = 1.0,
  });

  String localizedName(String locale, {String fallback = ''}) {
    final map = subjectNameMap;
    return (map[locale] ?? map['en'] ?? map['de'] ?? map.values.firstOrNull ?? fallback)
        .toString();
  }

  // Kept for code that hasn't migrated to localizedName yet.
  String? get subjectName {
    final v = subjectNameMap['en'] ?? subjectNameMap['de'] ?? subjectNameMap.values.firstOrNull;
    return v?.toString();
  }

  factory SubjectResult.fromJson(Map<String, dynamic> json) {
    final subjectId = (json['subjectId'] ?? json['subject_id']) as String;
    final gradeValue = (json['gradeValue'] ?? json['grade_value'] ?? json['grade']) as String? ?? '';
    final bonusPoints = ((json['bonusPoints'] ?? json['bonus_points']) as num?)?.toDouble() ?? 0.0;
    final tier = (json['gradeQualityTier'] ?? json['grade_quality_tier']) as String?;
    final norm = ((json['gradeNormalized100'] ?? json['grade_normalized_100']) as num?)?.toDouble();
    final settlementStatus = (json['settlementStatus'] ?? json['settlement_status']) as String? ?? 'unsettled';
    final weight = ((json['subjectWeight'] ?? json['subject_weight']) as num?)?.toDouble() ?? 1.0;

    Map<String, dynamic> nameMap = {};
    final directName = json['subjectName'] ?? json['subject_name'];
    if (directName is Map) {
      nameMap = Map<String, dynamic>.from(directName);
    } else if (directName is String && directName.isNotEmpty) {
      nameMap = {'en': directName};
    } else {
      final nested = json['subjects'] as Map<String, dynamic>?;
      final nameRaw = nested?['name'];
      if (nameRaw is Map) {
        nameMap = Map<String, dynamic>.from(nameRaw);
      } else if (nameRaw is String) {
        nameMap = {'en': nameRaw};
      }
    }

    return SubjectResult(
      subjectId: subjectId,
      subjectNameMap: nameMap,
      gradeValue: gradeValue,
      gradeNormalized100: norm,
      bonusPoints: bonusPoints,
      gradeQualityTier: tier,
      settlementStatus: settlementStatus,
      weight: weight,
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
  final String settlementStatus;
  final String? termName;
  final String? gradingSystemId;
  final String? gradingSystemCode;
  final bool gradingSystemBestIsHighest;
  final String? gradingSystemScaleType;
  final double? gradingSystemMinValue;
  final double? gradingSystemMaxValue;
  final List<dynamic> gradingSystemDefinitions;
  final DateTime createdAt;
  final List<SubjectResult> subjects;

  const TermResult({
    required this.id,
    required this.schoolYear,
    required this.termType,
    required this.classLevel,
    required this.totalBonusPoints,
    required this.status,
    this.settlementStatus = 'open',
    this.termName,
    this.gradingSystemId,
    this.gradingSystemCode,
    this.gradingSystemBestIsHighest = false,
    this.gradingSystemScaleType,
    this.gradingSystemMinValue,
    this.gradingSystemMaxValue,
    this.gradingSystemDefinitions = const [],
    required this.createdAt,
    required this.subjects,
  });

  factory TermResult.fromJson(Map<String, dynamic> json) {
    final subjectsRaw = (json['subjects'] ?? json['subject_grades']) as List<dynamic>? ?? [];
    final createdRaw = (json['createdAt'] ?? json['created_at']) as String?;

    // Parse grading system from nested object
    final gs = json['grading_systems'] as Map<String, dynamic>?;
    final gsCode = (json['grading_system_code'] ?? gs?['code']) as String?;
    final gsBestIsHighest = (gs?['best_is_highest'] as bool?) ?? false;
    final gsScaleType = gs?['scale_type'] as String?;
    final gsMin = (gs?['min_value'] as num?)?.toDouble();
    final gsMax = (gs?['max_value'] as num?)?.toDouble();
    final gsDefs = (gs?['grade_definitions'] as List<dynamic>?) ?? [];

    return TermResult(
      id: json['id'] as String,
      schoolYear: (json['schoolYear'] ?? json['school_year']) as String,
      termType: (json['termType'] ?? json['term_type']) as String,
      classLevel: (json['classLevel'] ?? json['class_level']) as int? ?? 1,
      totalBonusPoints:
          ((json['totalBonusPoints'] ?? json['total_bonus_points']) as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'active',
      settlementStatus: (json['settlementStatus'] ?? json['settlement_status']) as String? ?? 'open',
      termName: (json['termName'] ?? json['term_name']) as String?,
      gradingSystemId: (json['gradingSystemId'] ?? json['grading_system_id']) as String?,
      gradingSystemCode: gsCode,
      gradingSystemBestIsHighest: gsBestIsHighest,
      gradingSystemScaleType: gsScaleType,
      gradingSystemMinValue: gsMin,
      gradingSystemMaxValue: gsMax,
      gradingSystemDefinitions: gsDefs,
      createdAt: createdRaw != null ? DateTime.parse(createdRaw) : DateTime.now(),
      subjects: subjectsRaw.map((s) => SubjectResult.fromJson(s as Map<String, dynamic>)).toList(),
    );
  }

  // Weighted average of normalized_100 values (0-100, higher=better universally).
  double? get averageNormalized100 {
    final valid = subjects.where((s) => s.gradeNormalized100 != null).toList();
    if (valid.isEmpty) return null;
    final totalWeight = valid.fold<double>(0, (sum, s) => sum + s.weight);
    if (totalWeight == 0) return null;
    final weightedSum = valid.fold<double>(0, (sum, s) => sum + s.gradeNormalized100! * s.weight);
    return weightedSum / totalWeight;
  }

  // Tier based on normalized average — works for all grading systems.
  String get tier {
    final avg = averageNormalized100;
    if (avg == null) {
      // Fallback: DE_1_6 style arithmetic mean (legacy)
      final grades = subjects.map((s) => double.tryParse(s.gradeValue)).whereType<double>().toList();
      if (grades.isEmpty) return 'below';
      final mean = grades.reduce((a, b) => a + b) / grades.length;
      if (gradingSystemBestIsHighest) {
        final max = gradingSystemMaxValue ?? 15.0;
        final norm = (mean / max) * 100;
        return norm >= 80 ? 'best' : norm >= 60 ? 'second' : norm >= 40 ? 'third' : 'below';
      } else {
        final min = gradingSystemMinValue ?? 1.0;
        final max = gradingSystemMaxValue ?? 6.0;
        final norm = ((max - mean) / (max - min)) * 100;
        return norm >= 80 ? 'best' : norm >= 60 ? 'second' : norm >= 40 ? 'third' : 'below';
      }
    }
    if (avg >= 80) return 'best';
    if (avg >= 60) return 'second';
    if (avg >= 40) return 'third';
    return 'below';
  }

  // Primary display: native scale value (e.g. "2.3", "12.4", "B+", "73%").
  String get averagePrimary {
    final avg = averageNormalized100;
    if (avg == null) return _fallbackAveragePrimary;
    final scaleType = gradingSystemScaleType;

    if (scaleType == 'letter') return _nearestLetter(avg);
    if (scaleType == 'percentage') return '${avg.toStringAsFixed(0)}%';

    // Numeric: convert normalized back to native scale
    final min = gradingSystemMinValue ?? 1.0;
    final max = gradingSystemMaxValue ?? 6.0;
    final native = gradingSystemBestIsHighest
        ? min + (avg / 100) * (max - min)
        : max - (avg / 100) * (max - min);
    return native.toStringAsFixed(1);
  }

  // Secondary display for DE_GYMNASIUM: the 1-6 grade equivalent.
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

  String get _fallbackAveragePrimary {
    final grades = subjects.map((s) => double.tryParse(s.gradeValue)).whereType<double>().toList();
    if (grades.isEmpty) return '—';
    final mean = grades.reduce((a, b) => a + b) / grades.length;
    return mean.toStringAsFixed(1);
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
