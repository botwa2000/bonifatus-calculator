class GradingSystem {
  final String id;
  final String name;
  final double minGrade;
  final double maxGrade;
  final bool isLowerBetter;

  const GradingSystem({
    required this.id,
    required this.name,
    required this.minGrade,
    required this.maxGrade,
    required this.isLowerBetter,
  });

  factory GradingSystem.fromJson(Map<String, dynamic> json) {
    return GradingSystem(
      id: json['id'] as String,
      name: json['name'] as String,
      minGrade: (json['minGrade'] as num).toDouble(),
      maxGrade: (json['maxGrade'] as num).toDouble(),
      isLowerBetter: json['isLowerBetter'] as bool? ?? true,
    );
  }

  List<String> get gradeValues {
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
    return SubjectItem(
      id: json['id'] as String,
      name: json['name'] as String,
      isCoreSubject: json['isCoreSubject'] as bool? ?? false,
    );
  }
}

class CalculatorConfig {
  final List<GradingSystem> gradingSystems;
  final List<SubjectItem> subjects;

  const CalculatorConfig({
    required this.gradingSystems,
    required this.subjects,
  });

  factory CalculatorConfig.fromJson(Map<String, dynamic> json) {
    return CalculatorConfig(
      gradingSystems: (json['gradingSystems'] as List<dynamic>? ?? [])
          .map((g) => GradingSystem.fromJson(g as Map<String, dynamic>))
          .toList(),
      subjects: (json['subjects'] as List<dynamic>? ?? [])
          .map((s) => SubjectItem.fromJson(s as Map<String, dynamic>))
          .toList(),
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
      );
}
