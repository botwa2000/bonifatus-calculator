class SettlementPackageItem {
  final String id;
  final String? subjectName;
  final String? gradeValue;
  final String? gradeQualityTier;
  final double bonusPoints;
  final DateTime gradedAt;
  final String source; // 'calculator' | 'notes'

  const SettlementPackageItem({
    required this.id,
    this.subjectName,
    this.gradeValue,
    this.gradeQualityTier,
    required this.bonusPoints,
    required this.gradedAt,
    required this.source,
  });

  factory SettlementPackageItem.fromJson(Map<String, dynamic> json) {
    return SettlementPackageItem(
      id: json['id'] as String,
      subjectName: json['subjectName'] as String?,
      gradeValue: json['gradeValue'] as String?,
      gradeQualityTier: json['gradeQualityTier'] as String?,
      bonusPoints: ((json['bonusPoints']) as num?)?.toDouble() ?? 0.0,
      gradedAt: DateTime.parse(json['gradedAt'] as String),
      source: json['source'] as String? ?? 'notes',
    );
  }
}

class SettlementPackage {
  final String type; // 'report_card' | 'grade_period'
  final String id;
  final String label;
  final String childId;
  final String childName;
  final int itemCount;
  final double totalPoints;
  final String? periodStart;
  final String? periodEnd;
  final bool isOngoing;
  // Report card specific
  final String? termId;
  final String? schoolYear;
  final String? termType;
  final int? classLevel;
  final List<SettlementPackageItem> items;

  const SettlementPackage({
    required this.type,
    required this.id,
    required this.label,
    required this.childId,
    required this.childName,
    required this.itemCount,
    required this.totalPoints,
    this.periodStart,
    this.periodEnd,
    this.isOngoing = false,
    this.termId,
    this.schoolYear,
    this.termType,
    this.classLevel,
    required this.items,
  });

  bool get isReportCard => type == 'report_card';
  bool get isGradePeriod => type == 'grade_period';

  List<String> get quickGradeIds =>
      items.where((i) => i.source == 'notes').map((i) => i.id).toList();

  List<String> get subjectGradeIds =>
      items.where((i) => i.source == 'calculator').map((i) => i.id).toList();

  factory SettlementPackage.fromJson(Map<String, dynamic> json) {
    final itemsRaw = (json['items'] as List<dynamic>? ?? []);
    return SettlementPackage(
      type: json['type'] as String,
      id: json['id'] as String,
      label: json['label'] as String,
      childId: json['childId'] as String,
      childName: json['childName'] as String,
      itemCount: ((json['itemCount']) as num?)?.toInt() ?? 0,
      totalPoints: ((json['totalPoints']) as num?)?.toDouble() ?? 0.0,
      periodStart: json['periodStart'] as String?,
      periodEnd: json['periodEnd'] as String?,
      isOngoing: json['isOngoing'] as bool? ?? false,
      termId: json['termId'] as String?,
      schoolYear: json['schoolYear'] as String?,
      termType: json['termType'] as String?,
      classLevel: ((json['classLevel']) as num?)?.toInt(),
      items: itemsRaw
          .map((i) => SettlementPackageItem.fromJson(i as Map<String, dynamic>))
          .toList(),
    );
  }
}
