import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/quick_grades_provider.dart';
import '../../../models/quick_grade.dart';

class StudentInsightsScreen extends ConsumerWidget {
  const StudentInsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final gradesAsync = ref.watch(quickGradesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.insightsTitle)),
      body: gradesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text(l10n.insightsFailedToLoad, style: const TextStyle(color: AppColors.neutral600)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.read(quickGradesProvider.notifier).reload(),
                child: Text(l10n.insightsRetry),
              ),
            ],
          ),
        ),
        data: (grades) => _InsightsBody(grades: grades),
      ),
    );
  }
}

class _InsightsBody extends StatelessWidget {
  final List<QuickGrade> grades;
  const _InsightsBody({required this.grades});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;

    if (grades.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bar_chart_rounded, size: 56, color: AppColors.neutral200),
            const SizedBox(height: 12),
            Text(l10n.insightsNoGradesYet, style: const TextStyle(color: AppColors.neutral600, fontSize: 15)),
            const SizedBox(height: 4),
            Text(l10n.insightsAddGradesHint,
                style: const TextStyle(color: AppColors.neutral400, fontSize: 13)),
          ],
        ),
      );
    }

    final theme = Theme.of(context);
    final now = DateTime.now();

    // Last 6 months bar chart data
    final monthBuckets = <int, double>{};
    final monthLabels = <String>[];
    for (int i = 5; i >= 0; i--) {
      final m = DateTime(now.year, now.month - i);
      monthLabels.add(DateFormat('MMM', locale).format(m));
    }
    for (final g in grades) {
      final monthsAgo = (now.year - g.gradedAt.year) * 12 + (now.month - g.gradedAt.month);
      if (monthsAgo >= 0 && monthsAgo < 6) {
        final bucket = 5 - monthsAgo;
        monthBuckets[bucket] = (monthBuckets[bucket] ?? 0.0) + g.bonusPoints;
      }
    }
    final maxY = monthBuckets.values.fold(0.0, (m, v) => v > m ? v : m);

    // Tier distribution pie chart
    final tierCounts = <String, int>{'best': 0, 'second': 0, 'third': 0, 'below': 0};
    for (final g in grades) {
      tierCounts[g.gradeQualityTier] = (tierCounts[g.gradeQualityTier] ?? 0) + 1;
    }
    final total = grades.length;
    String pctOf(String tier) {
      final count = tierCounts[tier] ?? 0;
      if (total == 0) return '0%';
      return '${(count * 100 / total).round()}%';
    }

    // This week stats
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekGrades = grades.where((g) => !g.gradedAt.isBefore(DateTime(weekStart.year, weekStart.month, weekStart.day))).toList();
    final weekPts = weekGrades.fold(0.0, (s, g) => s + g.bonusPoints);
    final weekSettled = weekGrades.where((g) => g.settlementStatus == 'settled').fold(0.0, (s, g) => s + g.bonusPoints);
    final weekNet = weekPts - weekSettled;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        // Bar chart — bonus pts per month
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.insightsBonusPointsLastMonths, style: theme.textTheme.titleMedium),
              const SizedBox(height: 20),
              SizedBox(
                height: 160,
                child: BarChart(BarChartData(
                  maxY: maxY > 0 ? maxY * 1.2 : 50,
                  barGroups: List.generate(6, (i) {
                    final pts = (monthBuckets[i] ?? 0).toDouble();
                    final isHighest = pts == maxY && maxY > 0;
                    return BarChartGroupData(x: i, barRods: [
                      BarChartRodData(
                        toY: pts,
                        color: isHighest ? AppColors.tierBest : AppColors.primary,
                        width: 18,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ]);
                  }),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 24,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        return i < monthLabels.length
                            ? Text(monthLabels[i], style: const TextStyle(fontSize: 11, color: AppColors.neutral400))
                            : const SizedBox();
                      },
                    )),
                  ),
                  gridData: FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                )),
              ),
              if (maxY == 0)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Center(child: Text(l10n.insightsNoBonusPoints,
                      style: const TextStyle(color: AppColors.neutral400, fontSize: 12))),
                ),
            ]),
          ),
        ),
        const SizedBox(height: 12),

        // Pie chart — tier distribution
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.insightsGradeDistribution, style: theme.textTheme.titleMedium),
              const SizedBox(height: 4),
              Text('${grades.length} total grades', style: const TextStyle(fontSize: 12, color: AppColors.neutral400)),
              const SizedBox(height: 16),
              Row(children: [
                SizedBox(
                  height: 120, width: 120,
                  child: PieChart(PieChartData(
                    sections: [
                      if ((tierCounts['best'] ?? 0) > 0)
                        PieChartSectionData(value: (tierCounts['best'] ?? 0).toDouble(), color: AppColors.tierBest, title: '', radius: 40),
                      if ((tierCounts['second'] ?? 0) > 0)
                        PieChartSectionData(value: (tierCounts['second'] ?? 0).toDouble(), color: AppColors.tierSecond, title: '', radius: 40),
                      if ((tierCounts['third'] ?? 0) > 0)
                        PieChartSectionData(value: (tierCounts['third'] ?? 0).toDouble(), color: AppColors.tierThird, title: '', radius: 40),
                      if ((tierCounts['below'] ?? 0) > 0)
                        PieChartSectionData(value: (tierCounts['below'] ?? 0).toDouble(), color: AppColors.tierBelow, title: '', radius: 40),
                    ],
                    sectionsSpace: 2,
                    centerSpaceRadius: 24,
                  )),
                ),
                const SizedBox(width: 20),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _LegendRow(color: AppColors.tierBest, label: l10n.insightsTierBest, pct: pctOf('best')),
                  _LegendRow(color: AppColors.tierSecond, label: l10n.insightsTierGood, pct: pctOf('second')),
                  _LegendRow(color: AppColors.tierThird, label: l10n.insightsTierOk, pct: pctOf('third')),
                  _LegendRow(color: AppColors.tierBelow, label: l10n.insightsTierBelow, pct: pctOf('below')),
                ]),
              ]),
            ]),
          ),
        ),
        const SizedBox(height: 12),

        // This week stats
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.insightsThisWeek, style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                _BigStat(label: l10n.insightsGrades, value: weekGrades.length.toString()),
                _BigStat(label: l10n.insightsEarned, value: '+${weekPts % 1 == 0 ? weekPts.toInt() : weekPts.toStringAsFixed(1)} pts'),
                _BigStat(label: l10n.insightsUnsettled, value: '+${weekNet % 1 == 0 ? weekNet.toInt() : weekNet.toStringAsFixed(1)} pts'),
              ]),
            ]),
          ),
        ),
        const SizedBox(height: 12),

        // All-time summary
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.insightsAllTime, style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                _BigStat(label: l10n.insightsGrades, value: total.toString()),
                _BigStat(label: l10n.insightsTotalPts,
                    value: () { final v = grades.fold<double>(0.0, (s, g) => s + g.bonusPoints); return '+${v % 1 == 0 ? v.toInt() : v.toStringAsFixed(1)} pts'; }()),
                _BigStat(label: l10n.insightsPending,
                    value: () { final v = grades.where((g) => g.settlementStatus == 'pending').fold<double>(0.0, (s, g) => s + g.bonusPoints); return '+${v % 1 == 0 ? v.toInt() : v.toStringAsFixed(1)} pts'; }()),
              ]),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label, pct;
  const _LegendRow({required this.color, required this.label, required this.pct});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 6),
      Text(label, style: const TextStyle(fontSize: 12)),
      const SizedBox(width: 4),
      Text(pct, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
    ]),
  );
}

class _BigStat extends StatelessWidget {
  final String label, value;
  const _BigStat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary)),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral600)),
  ]);
}
