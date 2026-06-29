import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/connection_service.dart';
import '../../../models/child_data.dart';

class ChildrenQuickGradesNotifier
    extends AsyncNotifier<List<ChildWithGrades>> {
  @override
  Future<List<ChildWithGrades>> build() => _fetch();

  Future<List<ChildWithGrades>> _fetch() {
    final service = ref.read(connectionServiceProvider);
    return service.fetchChildrenQuickGrades();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetch);
  }
}

final childrenQuickGradesProvider =
    AsyncNotifierProvider<ChildrenQuickGradesNotifier, List<ChildWithGrades>>(
  ChildrenQuickGradesNotifier.new,
);
