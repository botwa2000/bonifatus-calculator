import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../api/services/grade_service.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.neutral50,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          title: const Text(
            'Rewards',
            style: TextStyle(
              color: AppColors.neutral900,
              fontWeight: FontWeight.w700,
              fontSize: 20,
            ),
          ),
          bottom: const TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.neutral400,
            indicatorColor: AppColors.primary,
            labelStyle: TextStyle(fontWeight: FontWeight.w600),
            tabs: [
              Tab(text: 'Quick Grades'),
              Tab(text: 'Summary'),
            ],
          ),
        ),
        body: childrenAsync.when(
          loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.primary)),
          error: (err, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      size: 48, color: AppColors.error),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to load rewards data',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.neutral900,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () =>
                        ref.read(childrenQuickGradesProvider.notifier).reload(),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (children) => TabBarView(
            children: [
              _QuickGradesTab(children: children),
              _SummaryTab(children: children),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickGradesTab extends StatelessWidget {
  final List<ChildWithGrades> children;

  const _QuickGradesTab({required this.children});

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return const Center(
        child: Text('No children connected',
            style: TextStyle(color: AppColors.neutral600)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: children.length,
      itemBuilder: (ctx, i) {
        final child = children[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _ChildGradesCard(child: child),
        );
      },
    );
  }
}

class _ChildGradesCard extends ConsumerWidget {
  final ChildWithGrades child;

  const _ChildGradesCard({required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingGrades = child.grades
        .where((g) => g.settlementStatus == 'unsettled')
        .toList()
      ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    final totalPts =
        pendingGrades.fold<int>(0, (sum, g) => sum + g.bonusPoints);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    child.childName.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  child.childName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
                  ),
                ),
                const Spacer(),
                Text(
                  '$totalPts pts pending',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tierBest,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: AppColors.neutral100),
          if (pendingGrades.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('No pending grades',
                  style: TextStyle(color: AppColors.neutral600)),
            )
          else
            ...pendingGrades.take(5).map((g) => _GradeRow(
              grade: g,
              onTap: () => context.push('/parent/children/${child.childId}'),
            )),
          const Divider(height: 1, color: AppColors.neutral100),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: pendingGrades.isEmpty ? null : () => _showSettleSheet(context, ref, pendingGrades, child),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  disabledForegroundColor: AppColors.neutral400,
                  side: BorderSide(
                    color: pendingGrades.isEmpty ? AppColors.neutral200 : AppColors.primary,
                  ),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text(
                  'Settle',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSettleSheet(BuildContext context, WidgetRef ref, List<ChildQuickGrade> pendingGrades, ChildWithGrades child) {
    final total = pendingGrades.fold<int>(0, (s, g) => s + g.bonusPoints);
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        bool settling = false;
        return StatefulBuilder(builder: (ctx, setSheet) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Settle Bonus for ${child.childName}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.tierBestLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Amount to transfer',
                      style: TextStyle(
                          color: AppColors.neutral700,
                          fontWeight: FontWeight.w500),
                    ),
                    Text(
                      '$total pts',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.tierBest,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: settling ? null : () => Navigator.of(ctx).pop(),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.neutral200),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Cancel',
                          style: TextStyle(color: AppColors.neutral700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: settling ? null : () async {
                        setSheet(() => settling = true);
                        try {
                          await ref.read(gradeServiceProvider).createSettlement(
                            childId: child.childId,
                            amount: total,
                            quickGradeIds: pendingGrades.map((g) => g.id).toList(),
                          );
                          if (ctx.mounted) Navigator.of(ctx).pop();
                          ref.read(childrenQuickGradesProvider.notifier).reload();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Settled!'), backgroundColor: AppColors.tierBest),
                            );
                          }
                        } catch (e) {
                          setSheet(() => settling = false);
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: settling
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Confirm Settle',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        ));
      },
    );
  }
}

class _GradeRow extends StatelessWidget {
  final ChildQuickGrade grade;
  final VoidCallback? onTap;

  const _GradeRow({required this.grade, this.onTap});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);

    return InkWell(
      onTap: onTap,
      child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: tierColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              grade.subjectName ?? 'Subject',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.neutral700,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: tierColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Grade ${grade.gradeValue}',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: tierColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            '+${grade.bonusPoints} pts',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.tierBest,
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class _SummaryTab extends StatelessWidget {
  final List<ChildWithGrades> children;

  const _SummaryTab({required this.children});

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return const Center(
        child: Text('No children connected',
            style: TextStyle(color: AppColors.neutral600)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: children.length,
      itemBuilder: (ctx, i) {
        final child = children[i];
        final totalPts = child.grades.fold<int>(0, (s, g) => s + g.bonusPoints);
        final pending = child.totalPendingPoints;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => context.push('/parent/children/${child.childId}'),
            child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    child.childName.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      fontSize: 18,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        child.childName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: AppColors.neutral900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${child.grades.length} grades · $totalPts pts total',
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.neutral600),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.tierBestLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$pending pts',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.tierBest,
                    ),
                  ),
                ),
              ],
            ),
            ),
          ),
        );
      },
    );
  }
}
