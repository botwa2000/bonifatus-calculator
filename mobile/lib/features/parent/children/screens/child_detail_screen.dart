import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../api/services/connection_service.dart';

List<ChildTermResult> _demoTermResults() => [
      ChildTermResult(
        id: 'tr1',
        schoolYear: '2024/25',
        termType: 'semester_2',
        classLevel: 7,
        totalBonusPoints: 14,
        createdAt: DateTime(2025, 6, 15),
        subjects: [
          const ChildSubjectGrade(id: 'sg1', subjectName: 'Mathematics', gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4),
          const ChildSubjectGrade(id: 'sg2', subjectName: 'German', gradeValue: '1', gradeQualityTier: 'best', bonusPoints: 4),
          const ChildSubjectGrade(id: 'sg3', subjectName: 'English', gradeValue: '3', gradeQualityTier: 'second', bonusPoints: 2),
          const ChildSubjectGrade(id: 'sg4', subjectName: 'Physics', gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4),
        ],
      ),
      ChildTermResult(
        id: 'tr2',
        schoolYear: '2024/25',
        termType: 'semester_1',
        classLevel: 7,
        totalBonusPoints: 10,
        createdAt: DateTime(2025, 1, 20),
        subjects: [
          const ChildSubjectGrade(id: 'sg5', subjectName: 'Mathematics', gradeValue: '3', gradeQualityTier: 'second', bonusPoints: 2),
          const ChildSubjectGrade(id: 'sg6', subjectName: 'German', gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4),
          const ChildSubjectGrade(id: 'sg7', subjectName: 'English', gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4),
        ],
      ),
    ];

final childTermResultsProvider =
    FutureProvider.family<List<ChildTermResult>, String>((ref, childId) async {
  if (kIsWeb && kDebugMode) return _demoTermResults();
  final service = ref.read(connectionServiceProvider);
  return service.fetchChildTermResults(childId);
});

class ChildDetailScreen extends ConsumerWidget {
  final String childId;

  const ChildDetailScreen({super.key, required this.childId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return childrenAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          title: const Text('Child Detail'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(
          title: const Text('Child Detail'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
          child: Text('Could not load data',
              style: TextStyle(color: AppColors.neutral600)),
        ),
      ),
      data: (children) {
        final child =
            children.where((c) => c.childId == childId).firstOrNull;

        if (child == null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Child Detail'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => context.pop(),
              ),
            ),
            body: const Center(
              child: Text('Child not found',
                  style: TextStyle(color: AppColors.neutral600)),
            ),
          );
        }

        return _buildScreen(context, ref, child);
      },
    );
  }

  Widget _buildScreen(BuildContext context, WidgetRef ref, ChildWithGrades child) {
    final sortedGrades = [...child.grades]
      ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    final totalPts =
        child.grades.fold<int>(0, (s, g) => s + g.bonusPoints);
    final pendingPts = child.totalPendingPoints;

    final termResultsAsync = ref.watch(childTermResultsProvider(childId));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
        title: Text(
          child.childName,
          style: const TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: _buildSummaryCard(child, totalPts, pendingPts),
            ),
          ),

          // Term Results section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
              child: Row(
                children: [
                  const Text(
                    'Term Results',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.neutral900,
                    ),
                  ),
                  const SizedBox(width: 8),
                  termResultsAsync.when(
                    loading: () => const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                          color: AppColors.primary, strokeWidth: 2),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                    data: (terms) => terms.isNotEmpty
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              terms.length.toString(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),

          termResultsAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: SizedBox(
                height: 60,
                child:
                    Center(child: CircularProgressIndicator(color: AppColors.primary)),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text('Could not load term results',
                    style: TextStyle(color: AppColors.neutral600, fontSize: 13)),
              ),
            ),
            data: (terms) => terms.isEmpty
                ? const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: Text(
                        'No term results saved yet.',
                        style: TextStyle(
                            color: AppColors.neutral400, fontSize: 13),
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _TermResultCard(term: terms[i]),
                        ),
                        childCount: terms.length,
                      ),
                    ),
                  ),
          ),

          // Quick Grades section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
              child: const Text(
                'Quick Grades',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral900,
                ),
              ),
            ),
          ),

          if (sortedGrades.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Text('No quick grades yet',
                    style: TextStyle(color: AppColors.neutral400, fontSize: 13)),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final grade = sortedGrades[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _GradeCard(grade: grade),
                    );
                  },
                  childCount: sortedGrades.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
      ChildWithGrades child, int totalPts, int pendingPts) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _Stat(
              icon: Icons.grade_outlined,
              label: 'Grades',
              value: child.grades.length.toString(),
            ),
          ),
          Container(
              width: 1, height: 50, color: Colors.white.withValues(alpha: 0.2)),
          Expanded(
            child: _Stat(
              icon: Icons.star_outline_rounded,
              label: 'Total Pts',
              value: totalPts.toString(),
            ),
          ),
          Container(
              width: 1, height: 50, color: Colors.white.withValues(alpha: 0.2)),
          Expanded(
            child: _Stat(
              icon: Icons.pending_outlined,
              label: 'Pending',
              value: '$pendingPts pts',
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _Stat({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _TermResultCard extends StatelessWidget {
  final ChildTermResult term;

  const _TermResultCard({required this.term});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
      collapsedShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.neutral100)),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.primary, width: 1.5)),
      backgroundColor: AppColors.white,
      collapsedBackgroundColor: AppColors.white,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(
          '${term.totalBonusPoints}',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: AppColors.primary,
          ),
        ),
      ),
      title: Text(
        term.displayLabel,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: AppColors.neutral900,
        ),
      ),
      subtitle: Text(
        '${term.termTypeDisplay} · Class ${term.classLevel} · ${term.subjects.length} subjects',
        style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
      ),
      trailing: Text(
        '+${term.totalBonusPoints} pts',
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.tierBest,
        ),
      ),
      children: term.subjects.map((s) {
        final tier = s.gradeQualityTier ?? 'below';
        final tierColor = AppColors.tierColor(tier);
        final tierBg = AppColors.tierColorLight(tier);
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: tierBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  s.gradeValue ?? '—',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: tierColor,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  s.subjectName ?? 'Subject',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.neutral700,
                  ),
                ),
              ),
              Text(
                '+${s.bonusPoints} pts',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.tierBest,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _GradeCard extends StatelessWidget {
  final ChildQuickGrade grade;

  const _GradeCard({required this.grade});

  @override
  Widget build(BuildContext context) {
    final tier = grade.gradeQualityTier;
    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);
    final dateStr = DateFormat('MMM d, yyyy').format(grade.gradedAt);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: tierColorLight,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Text(
              grade.gradeValue,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: tierColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  grade.subjectName ?? 'Subject',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.neutral900,
                  ),
                ),
                Text(
                  dateStr,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutral400,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${grade.bonusPoints} pts',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.tierBest,
                ),
              ),
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: grade.settlementStatus == 'settled'
                      ? AppColors.tierBestLight
                      : AppColors.tierThirdLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  grade.settlementStatus == 'settled'
                      ? 'Settled'
                      : 'Pending',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: grade.settlementStatus == 'settled'
                        ? AppColors.tierBest
                        : AppColors.tierThird,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
