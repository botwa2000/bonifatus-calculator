import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/connection_service.dart';
import '../../../api/services/grade_service.dart';
import '../../../models/child_data.dart';
import '../../../models/settlement_package.dart';

List<ChildWithGrades> _demoChildren() => [
      ChildWithGrades(
        childId: 'demo-child-maxim',
        childName: 'Maxim',
        grades: [
          ChildQuickGrade(
            id: 'g1', subjectId: 's1', subjectNameMap: const {'en': 'Mathematics', 'de': 'Mathematik'},
            gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4,
            settlementStatus: 'settled', gradedAt: DateTime(2025, 6, 10),
          ),
          ChildQuickGrade(
            id: 'g2', subjectId: 's2', subjectNameMap: const {'en': 'German', 'de': 'Deutsch'},
            gradeValue: '1', gradeQualityTier: 'best', bonusPoints: 4,
            settlementStatus: 'settled', gradedAt: DateTime(2025, 6, 8),
          ),
          ChildQuickGrade(
            id: 'g3', subjectId: 's3', subjectNameMap: const {'en': 'English', 'de': 'Englisch'},
            gradeValue: '3', gradeQualityTier: 'second', bonusPoints: 2,
            settlementStatus: 'unsettled', gradedAt: DateTime(2025, 6, 5),
          ),
          ChildQuickGrade(
            id: 'g4', subjectId: 's4', subjectNameMap: const {'en': 'Physics', 'de': 'Physik'},
            gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4,
            settlementStatus: 'unsettled', gradedAt: DateTime(2025, 5, 28),
          ),
        ],
      ),
    ];

class ChildrenQuickGradesNotifier
    extends AsyncNotifier<List<ChildWithGrades>> {
  @override
  Future<List<ChildWithGrades>> build() {
    if (kIsWeb && kDebugMode) return Future.value(_demoChildren());
    return _fetch();
  }

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

class SettlementsNotifier extends AsyncNotifier<List<SettlementRecord>> {
  @override
  Future<List<SettlementRecord>> build() {
    if (kIsWeb && kDebugMode) return Future.value([]);
    return _fetch();
  }

  Future<List<SettlementRecord>> _fetch() {
    return ref.read(gradeServiceProvider).fetchSettlements();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetch);
  }
}

final settlementsProvider =
    AsyncNotifierProvider<SettlementsNotifier, List<SettlementRecord>>(
  SettlementsNotifier.new,
);

class ChildProfilesNotifier extends AsyncNotifier<List<ChildProfile>> {
  @override
  Future<List<ChildProfile>> build() {
    if (kIsWeb && kDebugMode) return Future.value([]);
    return ref.read(connectionServiceProvider).fetchChildProfiles();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(connectionServiceProvider).fetchChildProfiles(),
    );
  }
}

final childProfilesProvider =
    AsyncNotifierProvider<ChildProfilesNotifier, List<ChildProfile>>(
  ChildProfilesNotifier.new,
);

class SettlementPackagesNotifier
    extends AsyncNotifier<List<SettlementPackage>> {
  @override
  Future<List<SettlementPackage>> build() {
    if (kIsWeb && kDebugMode) return Future.value([]);
    return ref.read(gradeServiceProvider).fetchSettlementPackages();
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(gradeServiceProvider).fetchSettlementPackages(),
    );
  }
}

final settlementPackagesProvider =
    AsyncNotifierProvider<SettlementPackagesNotifier, List<SettlementPackage>>(
  SettlementPackagesNotifier.new,
);

class SettlementPeriodUnitNotifier extends AsyncNotifier<String> {
  @override
  Future<String> build() {
    if (kIsWeb && kDebugMode) return Future.value('monthly');
    return ref.read(gradeServiceProvider).fetchSettlementPeriodUnit();
  }

  Future<void> setUnit(String unit) async {
    await ref.read(gradeServiceProvider).updateSettlementPeriodUnit(unit);
    state = AsyncValue.data(unit);
  }
}

final settlementPeriodUnitProvider =
    AsyncNotifierProvider<SettlementPeriodUnitNotifier, String>(
  SettlementPeriodUnitNotifier.new,
);
