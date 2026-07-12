import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/child_data.dart';
import '../providers/children_provider.dart';

class ParentInsightsScreen extends ConsumerWidget {
  const ParentInsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.parentInsightsTitle)),
      body: childrenAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text(l10n.parentInsightsFailedToLoad,
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(err.toString(),
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                    textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => ref.invalidate(childrenQuickGradesProvider),
                  child: Text(l10n.parentInsightsRetry),
                ),
              ],
            ),
          ),
        ),
        data: (children) {
          if (children.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.insights_outlined,
                        size: 64, color: theme.colorScheme.outlineVariant),
                    const SizedBox(height: 16),
                    Text(l10n.parentInsightsNoInsights,
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface)),
                    const SizedBox(height: 8),
                    Text(l10n.parentInsightsNoInsightsHint,
                        style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          }

          final pendingPts =
              children.fold(0, (sum, c) => sum + c.totalPendingPoints);
          final totalEarned = children.fold(
              0, (sum, c) => sum + c.grades.fold(0, (s, g) => s + g.bonusPoints));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.parentInsightsAllChildrenSummary,
                              style: theme.textTheme.titleMedium),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _Stat(label: l10n.parentInsightsTotalEarned, value: '$totalEarned pts'),
                              _Stat(label: l10n.parentInsightsPending, value: '$pendingPts pts'),
                              _Stat(
                                  label: l10n.parentInsightsChildren,
                                  value: '${children.length}'),
                            ],
                          ),
                        ]),
                  ),
                ),
                const SizedBox(height: 12),
                ...children.map((child) {
                  final avg = _computeAvg(child.grades);
                  return _ChildInsightCard(
                    childId: child.childId,
                    name: child.childName,
                    avgGradeLabel: avg != null ? avg.toStringAsFixed(1) : '—',
                    pts: child.totalPendingPoints,
                    tier: child.latestTier,
                  );
                }),
              ],
            ),
          );
        },
      ),
    );
  }

  double? _computeAvg(List<ChildQuickGrade> grades) {
    if (grades.isEmpty) return null;
    final nums = grades
        .map((g) => double.tryParse(g.gradeValue))
        .whereType<double>()
        .toList();
    if (nums.isEmpty) return null;
    return nums.reduce((a, b) => a + b) / nums.length;
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  const _Stat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value,
            style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.primary)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ]);
}

class _ChildInsightCard extends StatelessWidget {
  final String childId, name, avgGradeLabel, tier;
  final int pts;
  const _ChildInsightCard(
      {required this.childId,
      required this.name,
      required this.avgGradeLabel,
      required this.pts,
      required this.tier});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = AppColors.tierColor(tier);
    final lightColor = AppColors.tierColorLight(tier);
    final progressValue = pts > 0 ? (pts / 600.0).clamp(0.0, 1.0) : 0.0;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/parent/children/$childId'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
                backgroundColor: lightColor,
                child: Text(name[0],
                    style: TextStyle(
                        color: color, fontWeight: FontWeight.w700))),
            const SizedBox(width: 12),
            Text(name, style: theme.textTheme.titleMedium),
            const Spacer(),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                  color: lightColor,
                  borderRadius: BorderRadius.circular(20)),
              child: Text('${AppLocalizations.of(context)!.calculatorGradeLabel} $avgGradeLabel',
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w600,
                      fontSize: 12)),
            ),
          ]),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: progressValue,
            backgroundColor: theme.colorScheme.outlineVariant,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            borderRadius: BorderRadius.circular(4),
            minHeight: 8,
          ),
          const SizedBox(height: 6),
          Text(AppLocalizations.of(context)!.childrenPtsPending(pts),
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ]),
      ),
    ),
  );
  }
}
