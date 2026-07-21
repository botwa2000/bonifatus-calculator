import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../client.dart';
import '../../models/quick_grade.dart';
import '../../models/term_result.dart';
import '../../models/child_data.dart';
import '../../models/settlement_package.dart';

final gradeServiceProvider = Provider<GradeService>((ref) {
  return GradeService(ref.read(apiClientProvider));
});

class PreviewSubjectResult {
  final String subjectId;
  final String tier;
  final double bonus;
  final double weight;

  const PreviewSubjectResult({
    required this.subjectId,
    required this.tier,
    required this.bonus,
    required this.weight,
  });

  factory PreviewSubjectResult.fromJson(Map<String, dynamic> json) {
    return PreviewSubjectResult(
      subjectId: (json['subjectId'] ?? json['subject_id']) as String? ?? '',
      tier: (json['tier'] as String?) ?? 'below',
      bonus: ((json['bonus'] as num?)?.toDouble() ?? 0.0),
      weight: ((json['weight'] as num?)?.toDouble() ?? 1.0),
    );
  }
}

class PreviewResult {
  final double total;
  final List<PreviewSubjectResult> breakdown;

  const PreviewResult({required this.total, required this.breakdown});

  factory PreviewResult.fromJson(Map<String, dynamic> json) {
    return PreviewResult(
      total: ((json['total'] as num?)?.toDouble() ?? 0.0),
      breakdown: (json['breakdown'] as List<dynamic>? ?? [])
          .map((s) => PreviewSubjectResult.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }
}

class GradeService {
  final ApiClient _client;
  GradeService(this._client);

  Future<List<QuickGrade>> fetchQuickGrades() async {
    final resp = await _client.get('/api/grades/quick/list');
    final grades = resp.data['grades'] as List<dynamic>? ?? [];
    return grades
        .map((g) => QuickGrade.fromJson(g as Map<String, dynamic>))
        .toList();
  }

  Future<({String id, double bonusPoints})> saveQuickGrade({
    required String subjectId,
    required String gradingSystemId,
    required int classLevel,
    required String gradeValue,
    String? note,
  }) async {
    final body = <String, dynamic>{
      'subjectId': subjectId,
      'gradingSystemId': gradingSystemId,
      'classLevel': classLevel,
      'gradeValue': gradeValue,
    };
    if (note != null && note.isNotEmpty) body['note'] = note;

    final resp = await _client.post('/api/grades/quick/save', data: body);
    final qg = resp.data['quickGrade'] as Map<String, dynamic>;
    return (
      id: qg['id'] as String,
      bonusPoints: (qg['bonusPoints'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Future<void> deleteQuickGrade(String id) async {
    await _client.delete('/api/grades/quick/delete', data: {'id': id});
  }

  Future<List<TermResult>> fetchTermResults() async {
    final resp = await _client.get('/api/grades/list');
    final terms = resp.data['terms'] as List<dynamic>? ?? [];
    return terms
        .map((t) => TermResult.fromJson(t as Map<String, dynamic>))
        .toList();
  }

  Future<List<SettlementPackage>> fetchSettlementPackages() async {
    final resp = await _client.get('/api/parent/settlement/packages');
    final packages = resp.data['packages'] as List<dynamic>? ?? [];
    return packages
        .map((p) => SettlementPackage.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<String> fetchSettlementPeriodUnit() async {
    final resp = await _client.get('/api/parent/settlement/preference');
    return resp.data['periodUnit'] as String? ?? 'monthly';
  }

  Future<void> updateSettlementPeriodUnit(String periodUnit) async {
    await _client.patch('/api/parent/settlement/preference', data: {
      'periodUnit': periodUnit,
    });
  }

  Future<String> createSettlement({
    required String childId,
    required double amount,
    List<String> quickGradeIds = const [],
    List<String> subjectGradeIds = const [],
    String? packageType,
    String? packageLabel,
  }) async {
    final resp = await _client.post('/api/settlements/create', data: {
      'childId': childId,
      'amount': amount,
      'currency': 'pts',
      'method': 'app',
      if (quickGradeIds.isNotEmpty) 'quickGradeIds': quickGradeIds,
      if (subjectGradeIds.isNotEmpty) 'subjectGradeIds': subjectGradeIds,
      if (packageType != null) 'packageType': packageType,
      if (packageLabel != null) 'packageLabel': packageLabel,
    });
    return resp.data['settlementId'] as String;
  }

  Future<List<SettlementRecord>> fetchSettlements() async {
    final resp = await _client.get('/api/settlements/list');
    final settlements = resp.data['settlements'] as List<dynamic>? ?? [];
    return settlements
        .map((s) => SettlementRecord.fromJson(s as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> updateTerm({
    required TermResult term,
    required List<Map<String, dynamic>> subjects,
  }) async {
    await _client.post('/api/grades/update', data: {
      'termId': term.id,
      'gradingSystemId': term.gradingSystemId,
      'classLevel': term.classLevel,
      'termType': term.termType,
      'schoolYear': term.schoolYear,
      if (term.termName != null && term.termName!.isNotEmpty) 'termName': term.termName,
      'subjects': subjects,
    });
  }

  Future<void> updateFullTerm({
    required String termId,
    required String gradingSystemId,
    required int classLevel,
    required String termType,
    required String schoolYear,
    String? termName,
    required List<Map<String, dynamic>> subjects,
  }) async {
    await _client.post('/api/grades/update', data: {
      'termId': termId,
      'gradingSystemId': gradingSystemId,
      'classLevel': classLevel,
      'termType': termType,
      'schoolYear': schoolYear,
      if (termName != null && termName.isNotEmpty) 'termName': termName,
      'subjects': subjects,
    });
  }

  Future<void> deleteTerm(String id) async {
    await _client.delete('/api/grades/delete', data: {'id': id});
  }

  Future<PreviewResult> previewTerm({
    required String gradingSystemId,
    required int classLevel,
    required String termType,
    required List<Map<String, dynamic>> subjects,
  }) async {
    final resp = await _client.post('/api/grades/preview', data: {
      'gradingSystemId': gradingSystemId,
      'classLevel': classLevel,
      'termType': termType,
      'subjects': subjects,
    });
    return PreviewResult.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<void> updateTermName({
    required TermResult term,
    required String newName,
  }) async {
    if (term.gradingSystemId == null || term.subjects.isEmpty) return;
    await _client.post('/api/grades/update', data: {
      'termId': term.id,
      'gradingSystemId': term.gradingSystemId,
      'classLevel': term.classLevel,
      'termType': term.termType,
      'schoolYear': term.schoolYear,
      'termName': newName.trim().isEmpty ? null : newName.trim(),
      'subjects': term.subjects
          .map((s) => {
                'subjectId': s.subjectId,
                if (s.subjectName != null) 'subjectName': s.subjectName,
                'grade': s.gradeValue,
                'weight': 1,
              })
          .toList(),
    });
  }

  Future<String> saveTerm({
    required String gradingSystemId,
    required int classLevel,
    required String termType,
    required String schoolYear,
    String? termName,
    required List<Map<String, dynamic>> subjects,
  }) async {
    final body = <String, dynamic>{
      'gradingSystemId': gradingSystemId,
      'classLevel': classLevel,
      'termType': termType,
      'schoolYear': schoolYear,
      'subjects': subjects,
    };
    if (termName != null && termName.isNotEmpty) body['termName'] = termName;

    final resp = await _client.post('/api/grades/save', data: body);
    return resp.data['termId'] as String;
  }
}
