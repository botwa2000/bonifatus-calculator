import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/grade_service.dart';
import '../../../models/term_result.dart';

class TermResultsNotifier extends AsyncNotifier<List<TermResult>> {
  @override
  Future<List<TermResult>> build() => _fetch();

  Future<List<TermResult>> _fetch() {
    final service = ref.read(gradeServiceProvider);
    return service.fetchTermResults();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> deleteTerm(String id) async {
    final service = ref.read(gradeServiceProvider);
    await service.deleteTerm(id);
    await reload();
  }

  Future<void> updateTermName(String id, String newName) async {
    final service = ref.read(gradeServiceProvider);
    final terms = state.value ?? [];
    final term = terms.where((t) => t.id == id).firstOrNull;
    if (term == null) return;
    await service.updateTermName(term: term, newName: newName);
    await reload();
  }

  Future<void> updateTermGrades(String termId, List<Map<String, dynamic>> subjects) async {
    final service = ref.read(gradeServiceProvider);
    final terms = state.value ?? [];
    final term = terms.where((t) => t.id == termId).firstOrNull;
    if (term == null) return;
    await service.updateTerm(term: term, subjects: subjects);
    await reload();
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
    final service = ref.read(gradeServiceProvider);
    await service.updateFullTerm(
      termId: termId,
      gradingSystemId: gradingSystemId,
      classLevel: classLevel,
      termType: termType,
      schoolYear: schoolYear,
      termName: termName,
      subjects: subjects,
    );
    await reload();
  }

  Future<String> saveTerm({
    required String gradingSystemId,
    required int classLevel,
    required String termType,
    required String schoolYear,
    String? termName,
    required List<Map<String, dynamic>> subjects,
  }) async {
    final service = ref.read(gradeServiceProvider);
    final termId = await service.saveTerm(
      gradingSystemId: gradingSystemId,
      classLevel: classLevel,
      termType: termType,
      schoolYear: schoolYear,
      termName: termName,
      subjects: subjects,
    );
    await reload();
    return termId;
  }
}

final termResultsProvider =
    AsyncNotifierProvider<TermResultsNotifier, List<TermResult>>(
  TermResultsNotifier.new,
);
