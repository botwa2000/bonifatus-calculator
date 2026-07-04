class GradeDefinition {
  final String grade;
  final double? normalized100;
  final String? qualityTier;

  const GradeDefinition({
    required this.grade,
    this.normalized100,
    this.qualityTier,
  });

  factory GradeDefinition.fromJson(Map<String, dynamic> json) {
    return GradeDefinition(
      grade: (json['grade'] ?? '').toString(),
      normalized100: (json['normalized_100'] as num?)?.toDouble(),
      qualityTier: json['quality_tier'] as String?,
    );
  }
}

class GradingSystem {
  final String id;
  final String name;
  final double minGrade;
  final double maxGrade;
  final bool isLowerBetter;
  final List<GradeDefinition> gradeDefinitions;

  const GradingSystem({
    required this.id,
    required this.name,
    required this.minGrade,
    required this.maxGrade,
    required this.isLowerBetter,
    this.gradeDefinitions = const [],
  });

  factory GradingSystem.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['name'];
    final name = nameRaw is String
        ? nameRaw
        : nameRaw is Map
            ? (nameRaw['en'] ?? nameRaw.values.firstOrNull ?? 'Unknown').toString()
            : 'Unknown';

    final defsRaw = json['gradeDefinitions'] ?? json['grade_definitions'];
    final defs = defsRaw is List
        ? defsRaw
            .map((d) => GradeDefinition.fromJson(d as Map<String, dynamic>))
            .toList()
        : <GradeDefinition>[];

    return GradingSystem(
      id: json['id'] as String,
      name: name,
      minGrade: ((json['minGrade'] ?? json['minValue']) as num?)?.toDouble() ?? 1.0,
      maxGrade: ((json['maxGrade'] ?? json['maxValue']) as num?)?.toDouble() ?? 6.0,
      isLowerBetter: json['isLowerBetter'] as bool? ??
          !(json['bestIsHighest'] as bool? ?? true),
      gradeDefinitions: defs,
    );
  }

  // Ordered grade values for display (best first)
  List<String> get gradeValues {
    if (gradeDefinitions.isNotEmpty) {
      return gradeDefinitions.map((d) => d.grade).toList();
    }
    final values = <String>[];
    if (isLowerBetter) {
      for (var i = minGrade.toInt(); i <= maxGrade.toInt(); i++) {
        values.add(i.toString());
      }
    } else {
      for (var i = maxGrade.toInt(); i >= minGrade.toInt(); i--) {
        values.add(i.toString());
      }
    }
    return values;
  }

  String deriveTier(String grade) {
    if (gradeDefinitions.isNotEmpty) {
      final cleaned = grade.trim();
      final def = gradeDefinitions.where(
        (d) => d.grade.toLowerCase() == cleaned.toLowerCase(),
      ).firstOrNull;
      return def?.qualityTier ?? 'below';
    }
    // Numeric fallback
    final value = double.tryParse(grade);
    if (value == null) return 'below';
    if (isLowerBetter) {
      if (value <= 1.5) return 'best';
      if (value <= 2.5) return 'second';
      if (value <= 3.5) return 'third';
      return 'below';
    } else {
      if (value >= 85) return 'best';
      if (value >= 70) return 'second';
      if (value >= 50) return 'third';
      return 'below';
    }
  }
}

class BonusFactor {
  final String factorType;
  final String factorKey;
  final double factorValue;

  const BonusFactor({
    required this.factorType,
    required this.factorKey,
    required this.factorValue,
  });

  factory BonusFactor.fromJson(Map<String, dynamic> json) {
    return BonusFactor(
      factorType: json['factorType'] as String,
      factorKey: json['factorKey'] as String,
      factorValue: (json['factorValue'] as num).toDouble(),
    );
  }
}

class TermTypeItem {
  final String code;
  final String group;
  final String name;

  const TermTypeItem({
    required this.code,
    required this.group,
    required this.name,
  });

  factory TermTypeItem.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['name'];
    final name = nameRaw is String
        ? nameRaw
        : nameRaw is Map
            ? (nameRaw['en'] ?? nameRaw.values.firstOrNull ?? 'Unknown').toString()
            : 'Unknown';
    return TermTypeItem(
      code: json['code'] as String,
      group: (json['group'] as String?) ?? '',
      name: name,
    );
  }
}

class SubjectItem {
  final String id;
  final String name;
  final bool isCoreSubject;

  const SubjectItem({
    required this.id,
    required this.name,
    required this.isCoreSubject,
  });

  factory SubjectItem.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['name'];
    final name = nameRaw is String
        ? nameRaw
        : nameRaw is Map
            ? (nameRaw['en'] ?? nameRaw['de'] ?? nameRaw.values.firstOrNull ?? 'Unknown')
                .toString()
            : 'Unknown';
    return SubjectItem(
      id: json['id'] as String,
      name: name,
      isCoreSubject: json['isCoreSubject'] as bool? ??
          json['is_core_subject'] as bool? ??
          false,
    );
  }
}

class CalculatorConfig {
  final List<GradingSystem> gradingSystems;
  final List<SubjectItem> subjects;
  final List<BonusFactor> bonusFactors;
  final List<TermTypeItem> termTypes;

  const CalculatorConfig({
    required this.gradingSystems,
    required this.subjects,
    this.bonusFactors = const [],
    this.termTypes = const [],
  });

  factory CalculatorConfig.fromJson(Map<String, dynamic> json) {
    final termTypesRaw = json['termTypes'];
    List<TermTypeItem> termTypes = [];
    if (termTypesRaw is Map) {
      final typesList = termTypesRaw['types'] as List<dynamic>?;
      if (typesList != null) {
        termTypes = typesList
            .map((t) => TermTypeItem.fromJson(t as Map<String, dynamic>))
            .toList();
      }
    }

    return CalculatorConfig(
      gradingSystems: (json['gradingSystems'] as List<dynamic>? ?? [])
          .map((g) => GradingSystem.fromJson(g as Map<String, dynamic>))
          .toList(),
      subjects: (json['subjects'] as List<dynamic>? ?? [])
          .map((s) => SubjectItem.fromJson(s as Map<String, dynamic>))
          .toList(),
      bonusFactors: (json['bonusFactorDefaults'] as List<dynamic>? ?? [])
          .map((f) => BonusFactor.fromJson(f as Map<String, dynamic>))
          .toList(),
      termTypes: termTypes,
    );
  }

  GradingSystem get defaultGradingSystem => gradingSystems.isNotEmpty
      ? gradingSystems.first
      : const GradingSystem(
          id: 'de-standard',
          name: 'German 1-6',
          minGrade: 1,
          maxGrade: 6,
          isLowerBetter: true,
        );

  List<TermTypeItem> get effectiveTermTypes =>
      termTypes.isNotEmpty
          ? termTypes
          : const [
              TermTypeItem(code: 'semester_1', group: 'semester', name: 'Semester 1'),
              TermTypeItem(code: 'semester_2', group: 'semester', name: 'Semester 2'),
            ];

  // Calculate per-subject bonus using DB factors
  double getFactorValue(String type, String key, double fallback) {
    return bonusFactors
            .where((f) => f.factorType == type && f.factorKey == key)
            .map((f) => f.factorValue)
            .firstOrNull ??
        fallback;
  }

  SubjectBonusResult calculateSubjectBonus(
    GradingSystem system,
    int classLevel,
    String termType,
    String grade,
    double weight,
  ) {
    final tier = system.deriveTier(grade);
    final classLevelFactor =
        getFactorValue('class_level', 'class_$classLevel', classLevel.toDouble());
    final termFactor = getFactorValue('term_type', termType, 1.0);
    final gradeFactor = getFactorValue('grade_tier', tier, 0.0);
    final bonus = classLevelFactor * termFactor * gradeFactor * weight;
    return SubjectBonusResult(tier: tier, bonus: bonus);
  }

  static CalculatorConfig get fallback => const CalculatorConfig(
        gradingSystems: [
          GradingSystem(
            id: 'de-standard',
            name: 'German 1-6',
            minGrade: 1,
            maxGrade: 6,
            isLowerBetter: true,
          ),
        ],
        subjects: [],
        bonusFactors: [
          BonusFactor(factorType: 'grade_tier', factorKey: 'best', factorValue: 3.0),
          BonusFactor(factorType: 'grade_tier', factorKey: 'second', factorValue: 2.0),
          BonusFactor(factorType: 'grade_tier', factorKey: 'third', factorValue: 1.0),
          BonusFactor(factorType: 'grade_tier', factorKey: 'below', factorValue: 0.0),
          BonusFactor(factorType: 'term_type', factorKey: 'semester_1', factorValue: 0.5),
          BonusFactor(factorType: 'term_type', factorKey: 'semester_2', factorValue: 1.0),
        ],
      );
}

class SubjectBonusResult {
  final String tier;
  final double bonus;

  const SubjectBonusResult({required this.tier, required this.bonus});
}
