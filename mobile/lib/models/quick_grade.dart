class QuickGrade {
  final String id;
  final String subjectId;
  final Map<String, dynamic> subjectNameMap;
  final String gradeValue;
  final String gradeQualityTier;
  final double bonusPoints;
  final String settlementStatus;
  final DateTime gradedAt;

  const QuickGrade({
    required this.id,
    required this.subjectId,
    required this.subjectNameMap,
    required this.gradeValue,
    required this.gradeQualityTier,
    required this.bonusPoints,
    required this.settlementStatus,
    required this.gradedAt,
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

  factory QuickGrade.fromJson(Map<String, dynamic> json) {
    final nameRaw = json['subjectName'];
    Map<String, dynamic> nameMap = {};
    if (nameRaw is Map) {
      nameMap = Map<String, dynamic>.from(nameRaw);
    } else if (nameRaw is String && nameRaw.isNotEmpty) {
      nameMap = {'en': nameRaw};
    }
    return QuickGrade(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      subjectNameMap: nameMap,
      gradeValue: json['gradeValue'] as String,
      gradeQualityTier: json['gradeQualityTier'] as String? ?? 'below',
      bonusPoints: ((json['bonusPoints']) as num?)?.toDouble() ?? 0.0,
      settlementStatus: json['settlementStatus'] as String? ?? 'pending',
      gradedAt: DateTime.parse(json['gradedAt'] as String),
    );
  }
}
