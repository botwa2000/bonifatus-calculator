import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/quick_grades_provider.dart';
import '../providers/term_results_provider.dart';
import '../../../models/quick_grade.dart';
import '../../../models/term_result.dart';

class StudentInsightsScreen extends ConsumerWidget {
  const StudentInsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final gradesAsync = ref.watch(quickGradesProvider);
    final termsAsync = ref.watch(termResultsProvider);

    if (gradesAsync.isLoading || termsAsync.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.insightsTitle)),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (gradesAsync.hasError) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.insightsTitle)),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text(l10n.insightsFailedToLoad,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.read(quickGradesProvider.notifier).reload();
                  ref.read(termResultsProvider.notifier).reload();
                },
                child: Text(l10n.insightsRetry),
              ),
            ],
          ),
        ),
      );
    }

    final grades = gradesAsync.valueOrNull ?? [];
    final terms = termsAsync.valueOrNull ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.insightsTitle)),
      body: _InsightsBody(grades: grades, terms: terms),
    );
  }
}

enum _Period { month, threeMonths, year, allTime }

int _tierPriority(String tier) => switch (tier) {
      'best' => 4,
      'second' => 3,
      'third' => 2,
      _ => 1,
    };

int _streakWeeks(List<QuickGrade> grades) {
  if (grades.isEmpty) return 0;
  final weekStarts = grades.map((g) {
    final d = g.gradedAt;
    return DateTime(d.year, d.month, d.day - (d.weekday - 1));
  }).toSet().toList()..sort((a, b) => b.compareTo(a));

  final now = DateTime.now();
  final curWeekStart = DateTime(now.year, now.month, now.day - (now.weekday - 1));
  final prevWeekStart = curWeekStart.subtract(const Duration(days: 7));
  if (weekStarts.first.isBefore(prevWeekStart)) return 0;

  int streak = 1;
  for (int i = 0; i < weekStarts.length - 1; i++) {
    if (weekStarts[i].difference(weekStarts[i + 1]).inDays == 7) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

class _InsightsBody extends StatefulWidget {
  final List<QuickGrade> grades;
  final List<TermResult> terms;
  const _InsightsBody({required this.grades, required this.terms});
  @override
  State<_InsightsBody> createState() => _InsightsBodyState();
}

class _InsightsBodyState extends State<_InsightsBody> {
  _Period _period = _Period.allTime;

  List<T> _filterByPeriod<T>(List<T> items, DateTime Function(T) getDate, DateTime now) {
    if (_period == _Period.allTime) return items;
    final cutoff = switch (_period) {
      _Period.month => DateTime(now.year, now.month - 1, now.day),
      _Period.threeMonths => DateTime(now.year, now.month - 3, now.day),
      _Period.year => DateTime(now.year - 1, now.month, now.day),
      _Period.allTime => DateTime(1970),
    };
    return items.where((item) => !getDate(item).isBefore(cutoff)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;
    final theme = Theme.of(context);
    final now = DateTime.now();

    // Apply global period filter to both data sources
    final grades = _filterByPeriod(widget.grades, (g) => g.gradedAt, now);
    final terms = _filterByPeriod(widget.terms, (t) => t.createdAt, now);

    if (widget.grades.isEmpty && widget.terms.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bar_chart_rounded, size: 56, color: theme.colorScheme.outlineVariant),
            const SizedBox(height: 12),
            Text(l10n.insightsNoGradesYet,
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 15)),
            const SizedBox(height: 4),
            Text(l10n.insightsAddGradesHint,
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 13)),
          ],
        ),
      );
    }

    // ── Grade Trend (from calculator terms) ───────────────────────────────
    final trendTerms = [...terms]..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    final trendSpots = <FlSpot>[];
    final trendLabels = <String>[];
    for (final t in trendTerms) {
      final avg = t.averageNormalized100;
      if (avg != null) {
        trendSpots.add(FlSpot(trendSpots.length.toDouble(), avg));
        trendLabels.add(DateFormat('MMM yy', locale).format(t.createdAt));
      }
    }

    // ── Bar chart — bonus pts per month ───────────────────────────────────
    final monthBuckets = <int, double>{};
    final monthLabels = <String>[];
    for (int i = 5; i >= 0; i--) {
      final m = DateTime(now.year, now.month - i);
      monthLabels.add(DateFormat('MMM', locale).format(m));
    }
    for (final g in grades) {
      final monthsAgo =
          (now.year - g.gradedAt.year) * 12 + (now.month - g.gradedAt.month);
      if (monthsAgo >= 0 && monthsAgo < 6) {
        final bucket = 5 - monthsAgo;
        monthBuckets[bucket] = (monthBuckets[bucket] ?? 0.0) + g.bonusPoints;
      }
    }
    final maxY = monthBuckets.values.fold(0.0, (m, v) => v > m ? v : m);

    // ── Tier distribution pie ─────────────────────────────────────────────
    final tierCounts = <String, int>{'best': 0, 'second': 0, 'third': 0, 'below': 0};
    for (final g in grades) {
      tierCounts[g.gradeQualityTier] = (tierCounts[g.gradeQualityTier] ?? 0) + 1;
    }
    final total = grades.length;
    String pctOf(String tier) {
      final c = tierCounts[tier] ?? 0;
      if (total == 0) return '0%';
      return '${(c * 100 / total).round()}%';
    }

    // ── Period stats (uses already-filtered grades) ───────────────────────
    final pGrades = grades;
    final pPts = pGrades.fold(0.0, (s, g) => s + g.bonusPoints);
    final pPending = pGrades
        .where((g) => g.settlementStatus == 'pending')
        .fold(0.0, (s, g) => s + g.bonusPoints);
    String fmtPts(double v) =>
        '+${v % 1 == 0 ? v.toInt() : v.toStringAsFixed(1)} ${l10n.ptsAbbr}';

    // ── Subject Rankings (from term subjects) ─────────────────────────────
    final subjectData = <String, ({String name, double sum, int count})>{};
    for (final term in terms) {
      for (final s in term.subjects) {
        final norm = s.gradeNormalized100;
        if (norm == null) continue;
        final name = s.localizedName(locale, fallback: s.subjectId);
        final ex = subjectData[s.subjectId];
        subjectData[s.subjectId] = ex == null
            ? (name: name, sum: norm, count: 1)
            : (name: ex.name, sum: ex.sum + norm, count: ex.count + 1);
      }
    }
    final rankings = subjectData.entries
        .map((e) => (name: e.value.name, avg: e.value.sum / e.value.count))
        .toList()
      ..sort((a, b) => b.avg.compareTo(a.avg));
    final topRankings = rankings.take(5).toList();

    // ── Streak ────────────────────────────────────────────────────────────
    final streakCount = _streakWeeks(grades);

    // ── Best & Worst grades ───────────────────────────────────────────────
    QuickGrade? bestGrade, worstGrade;
    if (grades.isNotEmpty) {
      bestGrade = grades.reduce((a, b) {
        final pa = _tierPriority(a.gradeQualityTier);
        final pb = _tierPriority(b.gradeQualityTier);
        if (pa != pb) return pa > pb ? a : b;
        return a.bonusPoints >= b.bonusPoints ? a : b;
      });
      if (grades.length >= 2) {
        worstGrade = grades.reduce((a, b) {
          final pa = _tierPriority(a.gradeQualityTier);
          final pb = _tierPriority(b.gradeQualityTier);
          if (pa != pb) return pa < pb ? a : b;
          return a.bonusPoints <= b.bonusPoints ? a : b;
        });
        if (worstGrade.id == bestGrade.id) worstGrade = null;
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [

        // ── Global period filter ──────────────────────────────────────────
        SegmentedButton<_Period>(
          style: SegmentedButton.styleFrom(
            textStyle: const TextStyle(fontSize: 11),
            visualDensity: VisualDensity.compact,
          ),
          segments: [
            ButtonSegment(value: _Period.month, label: Text(l10n.insightsPeriodMonth)),
            ButtonSegment(value: _Period.threeMonths, label: Text(l10n.insightsPeriod3Months)),
            ButtonSegment(value: _Period.year, label: Text(l10n.insightsPeriodYear)),
            ButtonSegment(value: _Period.allTime, label: Text(l10n.insightsPeriodAll)),
          ],
          selected: {_period},
          onSelectionChanged: (sel) => setState(() => _period = sel.first),
        ),
        const SizedBox(height: 12),

        if (grades.isEmpty && terms.isEmpty) ...[
          const SizedBox(height: 48),
          Icon(Icons.filter_list_rounded, size: 40, color: theme.colorScheme.outlineVariant),
          const SizedBox(height: 8),
          Text(l10n.insightsNoGradesYet,
              style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 14)),
          const SizedBox(height: 60),
        ],

        // ── Grade Trend (calculator terms) ────────────────────────────────
        if (trendSpots.length >= 2) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l10n.insightsGradeTrend, style: theme.textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(l10n.insightsGradeTrendSubtitle,
                    style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 130,
                  child: LineChart(LineChartData(
                    minY: 0,
                    maxY: 100,
                    lineBarsData: [
                      LineChartBarData(
                        spots: trendSpots,
                        isCurved: trendSpots.length > 2,
                        color: AppColors.primary,
                        barWidth: 2.5,
                        dotData: FlDotData(show: trendSpots.length <= 8),
                        belowBarData: BarAreaData(
                          show: true,
                          color: AppColors.primary.withValues(alpha: 0.08),
                        ),
                      ),
                    ],
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 20,
                        getTitlesWidget: (v, _) {
                          final i = v.toInt();
                          if (i < 0 || i >= trendLabels.length) return const SizedBox();
                          return Text(trendLabels[i],
                              style: TextStyle(fontSize: 9, color: theme.colorScheme.onSurfaceVariant));
                        },
                      )),
                    ),
                    gridData: FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                  )),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Bar chart — bonus pts per month ──────────────────────────────
        if (grades.isNotEmpty) ...[
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
                              ? Text(monthLabels[i],
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: theme.colorScheme.onSurfaceVariant))
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
                    child: Center(
                      child: Text(l10n.insightsNoBonusPoints,
                          style: TextStyle(
                              color: theme.colorScheme.onSurfaceVariant, fontSize: 12)),
                    ),
                  ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Tier distribution pie ─────────────────────────────────────────
        if (grades.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l10n.insightsGradeDistribution, style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('${grades.length} ${l10n.totalGradesLabel}',
                    style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 16),
                Row(children: [
                  SizedBox(
                    height: 120, width: 120,
                    child: PieChart(PieChartData(
                      sections: [
                        if ((tierCounts['best'] ?? 0) > 0)
                          PieChartSectionData(
                              value: (tierCounts['best'] ?? 0).toDouble(),
                              color: AppColors.tierBest, title: '', radius: 40),
                        if ((tierCounts['second'] ?? 0) > 0)
                          PieChartSectionData(
                              value: (tierCounts['second'] ?? 0).toDouble(),
                              color: AppColors.tierSecond, title: '', radius: 40),
                        if ((tierCounts['third'] ?? 0) > 0)
                          PieChartSectionData(
                              value: (tierCounts['third'] ?? 0).toDouble(),
                              color: AppColors.tierThird, title: '', radius: 40),
                        if ((tierCounts['below'] ?? 0) > 0)
                          PieChartSectionData(
                              value: (tierCounts['below'] ?? 0).toDouble(),
                              color: AppColors.tierBelow, title: '', radius: 40),
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
        ],

        // ── Streak & Best/Worst row ────────────────────────────────────────
        if (grades.isNotEmpty) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(l10n.insightsStreak,
                          style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant)),
                      const SizedBox(height: 8),
                      if (streakCount > 0) ...[
                        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text(
                            l10n.insightsStreakWeeks(streakCount),
                            style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                color: AppColors.tierBest),
                          ),
                          const SizedBox(width: 4),
                          const Padding(
                            padding: EdgeInsets.only(bottom: 4),
                            child: Icon(Icons.local_fire_department_rounded,
                                color: AppColors.tierBest, size: 20),
                          ),
                        ]),
                      ] else
                        Text(l10n.insightsNoStreak,
                            style: TextStyle(
                                fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                    ]),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(children: [
                  if (bestGrade != null)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(l10n.insightsBestGrade,
                              style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                          const SizedBox(height: 4),
                          Text(
                            bestGrade.localizedName(locale, fallback: l10n.subjectFallback),
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${bestGrade.gradeValue}  +${bestGrade.bonusPoints.toInt()} ${l10n.ptsAbbr}',
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.tierBest,
                                fontWeight: FontWeight.w700),
                          ),
                        ]),
                      ),
                    ),
                  if (worstGrade != null) ...[
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(l10n.insightsWorstGrade,
                              style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                          const SizedBox(height: 4),
                          Text(
                            worstGrade.localizedName(locale, fallback: l10n.subjectFallback),
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${worstGrade.gradeValue}  +${worstGrade.bonusPoints.toInt()} ${l10n.ptsAbbr}',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppColors.tierColor(worstGrade.gradeQualityTier),
                                fontWeight: FontWeight.w700),
                          ),
                        ]),
                      ),
                    ),
                  ],
                ]),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],

        // ── Subject Rankings (from calculator terms) ──────────────────────
        if (topRankings.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l10n.insightsSubjectRankings, style: theme.textTheme.titleMedium),
                const SizedBox(height: 12),
                ...topRankings.asMap().entries.map((entry) {
                  final i = entry.key;
                  final r = entry.value;
                  final tierStr = r.avg >= 80
                      ? 'best'
                      : r.avg >= 60
                          ? 'second'
                          : r.avg >= 40
                              ? 'third'
                              : 'below';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(children: [
                      Container(
                        width: 22, height: 22,
                        decoration: BoxDecoration(
                          color: AppColors.tierColorLight(tierStr),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text('${i + 1}',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.tierColor(tierStr))),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(r.name,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w500),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                      SizedBox(
                        width: 60,
                        height: 6,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: r.avg / 100.0,
                            backgroundColor: AppColors.tierColorLight(tierStr),
                            valueColor: AlwaysStoppedAnimation<Color>(
                                AppColors.tierColor(tierStr)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${r.avg.round()}%',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.tierColor(tierStr))),
                    ]),
                  );
                }),
              ]),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Period stats ──────────────────────────────────────────────────
        if (grades.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                _BigStat(label: l10n.insightsGrades, value: pGrades.length.toString()),
                _BigStat(label: l10n.insightsEarned, value: fmtPts(pPts)),
                _BigStat(label: l10n.insightsPending, value: fmtPts(pPending)),
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
          Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(pct,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      );
}

class _BigStat extends StatelessWidget {
  final String label, value;
  const _BigStat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value,
            style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.primary)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(
                fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ]);
}
