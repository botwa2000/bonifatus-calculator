import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/grade_service.dart';
import '../../../models/quick_grade.dart';

class QuickGradesNotifier extends AsyncNotifier<List<QuickGrade>> {
  @override
  Future<List<QuickGrade>> build() => _fetch();

  Future<List<QuickGrade>> _fetch() {
    final service = ref.read(gradeServiceProvider);
    return service.fetchQuickGrades();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> addGrade({
    required String subjectId,
    required String gradingSystemId,
    required int classLevel,
    required String gradeValue,
    String? note,
  }) async {
    final service = ref.read(gradeServiceProvider);
    await service.saveQuickGrade(
      subjectId: subjectId,
      gradingSystemId: gradingSystemId,
      classLevel: classLevel,
      gradeValue: gradeValue,
      note: note,
    );
    await reload();
  }

  Future<void> deleteGrade(String id) async {
    final service = ref.read(gradeServiceProvider);
    await service.deleteQuickGrade(id);
    await reload();
  }
}

final quickGradesProvider =
    AsyncNotifierProvider<QuickGradesNotifier, List<QuickGrade>>(
  QuickGradesNotifier.new,
);
