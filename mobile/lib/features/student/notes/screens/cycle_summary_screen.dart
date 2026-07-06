import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/quick_grades_provider.dart';
import '../../../../models/quick_grade.dart';

class CycleSummaryScreen extends ConsumerWidget {
  final String cycleId; // ISO week-start date "YYYY-MM-DD"

  const CycleSummaryScreen({super.key, required this.cycleId});

  DateTime? _parseWeekStart() {
    try {
      return DateTime.parse(cycleId);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(quickGradesProvider);
    final weekStart = _parseWeekStart();

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
        title: const Text(
          'Cycle Summary',
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: gradesAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (_, __) => const Center(
          child: Text('Could not load grades',
              style: TextStyle(color: AppColors.neutral600)),
        ),
        data: (allGrades) {
          List<QuickGrade> weekGrades;
          DateTime startDate;
          DateTime endDate;

          if (weekStart != null) {
            startDate = weekStart;
            endDate = weekStart.add(const Duration(days: 6));
            weekGrades = allGrades.where((g) {
              final d =
                  DateTime(g.gradedAt.year, g.gradedAt.month, g.gradedAt.day);
              final s = DateTime(
                  startDate.year, startDate.month, startDate.day);
              final e =
                  DateTime(endDate.year, endDate.month, endDate.day);
              return !d.isBefore(s) && !d.isAfter(e);
            }).toList()
              ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
          } else {
            weekGrades = [...allGrades]
              ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
            final now = DateTime.now();
            startDate = now.subtract(Duration(days: now.weekday - 1));
            endDate = startDate.add(const Duration(days: 6));
          }

          final totalPositive = weekGrades
              .where((g) => g.bonusPoints > 0)
              .fold<double>(0.0, (s, g) => s + g.bonusPoints);
          final netPts = weekGrades.fold<double>(0.0, (s, g) => s + g.bonusPoints);

          final fmt = DateFormat('MMM d, yyyy');
          final startStr = fmt.format(startDate);
          final endStr = fmt.format(endDate);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(
                  cycleType: 'Weekly',
                  startDate: startStr,
                  endDate: endStr,
                  totalPositive: totalPositive,
                  netPts: netPts,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Notes in this Cycle',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
                  ),
                ),
                const SizedBox(height: 12),
                if (weekGrades.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'No grades in this period',
                        style: TextStyle(color: AppColors.neutral600),
                      ),
                    ),
                  )
                else
                  ...weekGrades.map(
                    (grade) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _CycleNoteCard(grade: grade),
                    ),
                  ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCard({
    required String cycleType,
    required String startDate,
    required String endDate,
    required double totalPositive,
    required double netPts,
  }) {
    final netColor = netPts >= 0 ? AppColors.tierBest : AppColors.tierBelow;
    final netBg =
        netPts >= 0 ? AppColors.tierBestLight : AppColors.tierBelowLight;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  cycleType,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '$startDate – $endDate',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _StatBox(
                  label: 'Positive',
                  value: '+${totalPositive % 1 == 0 ? totalPositive.toInt() : totalPositive.toStringAsFixed(1)} pts',
                  valueColor: Colors.white,
                  bgColor: Colors.white.withValues(alpha: 0.15),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatBox(
                  label: 'Net',
                  value: '${netPts % 1 == 0 ? netPts.toInt() : netPts.toStringAsFixed(1)} pts',
                  valueColor: netColor,
                  bgColor: netBg,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  final Color bgColor;

  const _StatBox({
    required this.label,
    required this.value,
    required this.valueColor,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: valueColor.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _CycleNoteCard extends StatelessWidget {
  final QuickGrade grade;

  const _CycleNoteCard({required this.grade});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);
    final tierColorLight = AppColors.tierColorLight(grade.gradeQualityTier);
    final dateStr = DateFormat('MMM d').format(grade.gradedAt);

    return InkWell(
      onTap: () => context.push('/student/notes/detail/${grade.id}'),
      borderRadius: BorderRadius.circular(14),
      child: Container(
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
            width: 40,
            height: 40,
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
          Text(
            '+${grade.bonusPoints % 1 == 0 ? grade.bonusPoints.toInt() : grade.bonusPoints.toStringAsFixed(1)} pts',
            style: const TextStyle(
              fontSize: 14,
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
