import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/child_data.dart';
import '../providers/children_provider.dart';
import '../../../utils/format_utils.dart';

// ── helpers ───────────────────────────────────────────────────────────────────

String _relativeDate(DateTime dt, AppLocalizations l10n) {
  final days = DateTime.now().difference(dt).inDays;
  if (days == 0) return l10n.insightsToday;
  if (days == 1) return l10n.insightsYesterday;
  return l10n.insightsDaysAgo(days);
}

// ── screen ────────────────────────────────────────────────────────────────────

class ParentInsightsScreen extends ConsumerStatefulWidget {
  const ParentInsightsScreen({super.key});

  @override
  ConsumerState<ParentInsightsScreen> createState() => _ParentInsightsScreenState();
}

class _ParentInsightsScreenState extends ConsumerState<ParentInsightsScreen> {
  // Empty set = "All" selected. Non-empty = filter to these child IDs.
  final Set<String> _selectedChildIds = {};

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.parentInsightsTitle)),
      body: childrenAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text(l10n.parentInsightsFailedToLoad, style: theme.textTheme.titleMedium),
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
                    Icon(Icons.insights_outlined, size: 64, color: theme.colorScheme.outlineVariant),
                    const SizedBox(height: 16),
                    Text(l10n.parentInsightsNoInsights,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(l10n.parentInsightsNoInsightsHint,
                        style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          }

          // Remove stale IDs that no longer exist in the loaded children list.
          final validIds = children.map((c) => c.childId).toSet();
          final activeIds = _selectedChildIds.intersection(validIds);

          final visibleChildren = activeIds.isEmpty
              ? children
              : children.where((c) => activeIds.contains(c.childId)).toList();

          final allGrades = visibleChildren
              .expand((c) => c.grades.map((g) => (child: c, grade: g)))
              .toList()
            ..sort((a, b) => b.grade.gradedAt.compareTo(a.grade.gradedAt));

          final unsettledGrades = allGrades
              .where((e) => e.grade.settlementStatus == 'unsettled')
              .toList();

          final totalUnsettledPts =
              unsettledGrades.fold<double>(0.0, (s, e) => s + e.grade.bonusPoints);
          final totalUnsettledItems = unsettledGrades.length;

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(childrenQuickGradesProvider),
            child: CustomScrollView(
              slivers: [
                // Child filter chips
                if (children.length > 1)
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 44,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(l10n.insightsFilterAll),
                              selected: activeIds.isEmpty,
                              onSelected: (_) => setState(() => _selectedChildIds.clear()),
                              selectedColor: AppColors.primary.withValues(alpha: 0.15),
                              checkmarkColor: AppColors.primary,
                              labelStyle: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: activeIds.isEmpty
                                    ? AppColors.primary
                                    : theme.colorScheme.onSurfaceVariant,
                              ),
                              side: BorderSide(
                                color: activeIds.isEmpty
                                    ? AppColors.primary
                                    : theme.colorScheme.outlineVariant,
                              ),
                            ),
                          ),
                          for (final c in children)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(c.childName),
                                selected: activeIds.contains(c.childId),
                                onSelected: (on) => setState(() {
                                  if (on) {
                                    _selectedChildIds.add(c.childId);
                                  } else {
                                    _selectedChildIds.remove(c.childId);
                                  }
                                }),
                                selectedColor: AppColors.primary.withValues(alpha: 0.15),
                                checkmarkColor: AppColors.primary,
                                labelStyle: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: activeIds.contains(c.childId)
                                      ? AppColors.primary
                                      : theme.colorScheme.onSurfaceVariant,
                                ),
                                side: BorderSide(
                                  color: activeIds.contains(c.childId)
                                      ? AppColors.primary
                                      : theme.colorScheme.outlineVariant,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: _SummaryBanner(
                      unsettledPts: totalUnsettledPts,
                      unsettledCount: totalUnsettledItems,
                      childCount: visibleChildren.length,
                    ),
                  ),
                ),

                if (totalUnsettledItems > 0) ...[
                  SliverToBoxAdapter(child: _SectionHeader(label: l10n.insightsReadyToSettle)),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _SettleNavigationCard(
                        pts: totalUnsettledPts,
                        count: totalUnsettledItems,
                      ),
                    ),
                  ),
                ],

                SliverToBoxAdapter(child: _SectionHeader(label: l10n.insightsRecentActivity)),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _ActivityRow(child: allGrades[i].child, grade: allGrades[i].grade),
                    ),
                    childCount: allGrades.length,
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          );
        },
      ),
    );
  }

}

// ── widgets ───────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String label;
  const _SectionHeader({required this.label});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
}

class _SummaryBanner extends StatelessWidget {
  final double unsettledPts;
  final int unsettledCount, childCount;
  const _SummaryBanner({required this.unsettledPts, required this.unsettledCount, required this.childCount});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF6B4EFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(child: _BannerStat(value: fmtPts(unsettledPts), unit: l10n.ptsAbbr, label: l10n.insightsPendingPts)),
          Container(width: 1, height: 36, color: Colors.white24),
          Expanded(child: _BannerStat(value: '$unsettledCount', label: l10n.insightsUnsettledGrades)),
          Container(width: 1, height: 36, color: Colors.white24),
          Expanded(child: _BannerStat(value: '$childCount', label: l10n.parentInsightsChildren)),
        ],
      ),
    );
  }
}

class _BannerStat extends StatelessWidget {
  final String value, label;
  final String? unit;
  const _BannerStat({required this.value, required this.label, this.unit});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
              if (unit != null) ...[
                const SizedBox(width: 2),
                Text(unit!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70)),
              ],
            ],
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.white70), textAlign: TextAlign.center),
        ],
      );
}

// ── settle navigation card ────────────────────────────────────────────────────

class _SettleNavigationCard extends StatelessWidget {
  final double pts;
  final int count;
  const _SettleNavigationCard({required this.pts, required this.count});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () => context.go('/parent/settle'),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.payments_outlined, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$count ${l10n.insightsUnsettledGrades}',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface),
                  ),
                  Text(
                    '+${fmtPts(pts)} ${l10n.ptsAbbr} ${l10n.parentInsightsPending.toLowerCase()}',
                    style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                l10n.settleTitle,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── activity feed row ─────────────────────────────────────────────────────────

class _ActivityRow extends StatelessWidget {
  final ChildWithGrades child;
  final ChildQuickGrade grade;
  const _ActivityRow({required this.child, required this.grade});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);
    final isSettled = grade.settlementStatus == 'settled';

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 4, height: 40,
            decoration: BoxDecoration(color: tierColor, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${child.childName}  ·  ${grade.subjectName ?? l10n.subjectFallback}',
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(_relativeDate(grade.gradedAt, l10n),
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: tierColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              grade.gradeSource == 'calculator'
                  ? '${l10n.calculatorGradeLabel} ${grade.gradeValue}'
                  : grade.gradeValue,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: tierColor),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('+${fmtPts(grade.bonusPoints)} ${l10n.ptsAbbr}',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.tierBest)),
              if (isSettled)
                Text(l10n.childDetailSettled,
                    style: theme.textTheme.bodySmall?.copyWith(color: AppColors.tierBest, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }
}
