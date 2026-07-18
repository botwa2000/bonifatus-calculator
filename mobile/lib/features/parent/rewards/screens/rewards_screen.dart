import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../api/services/grade_service.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        appBar: AppBar(
          elevation: 0,
          title: Text(
            l10n.rewardsTitle,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 20,
            ),
          ),
          bottom: TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            indicatorColor: AppColors.primary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600),
            tabs: [
              Tab(text: l10n.rewardsTabGrades),
              Tab(text: l10n.rewardsTabSummary),
              Tab(text: l10n.rewardsTabHistory),
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
                  Text(
                    l10n.rewardsFailedToLoadData,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () =>
                        ref.read(childrenQuickGradesProvider.notifier).reload(),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white),
                    child: Text(l10n.rewardsRetry),
                  ),
                ],
              ),
            ),
          ),
          data: (children) => TabBarView(
            children: [
              _GradesTab(children: children),
              _SummaryTab(children: children),
              const _HistoryTab(),
            ],
          ),
        ),
      ),
    );
  }
}

// ── helpers (week grouping, same logic as Insights screen) ──────────────────

DateTime _rewardsWeekStart(DateTime d) {
  final local = d.toLocal();
  final day = DateTime(local.year, local.month, local.day);
  return day.subtract(Duration(days: day.weekday - 1));
}

String _rewardsWeekLabel(DateTime ws) {
  final we = ws.add(const Duration(days: 6));
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return ws.month == we.month
      ? '${months[ws.month]} ${ws.day}–${we.day}'
      : '${months[ws.month]} ${ws.day} – ${months[we.month]} ${we.day}';
}

// ── grades tab ───────────────────────────────────────────────────────────────

class _GradesTab extends StatelessWidget {
  final List<ChildWithGrades> children;

  const _GradesTab({required this.children});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (children.isEmpty) {
      return Center(
        child: Text(l10n.rewardsNoChildrenConnected,
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: children.length,
      itemBuilder: (ctx, i) {
        final child = children[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
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
    final l10n = AppLocalizations.of(context)!;
    final pendingGrades = child.grades
        .where((g) => g.settlementStatus == 'unsettled')
        .toList()
      ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    final totalPts = pendingGrades.fold<int>(0, (sum, g) => sum + g.bonusPoints);

    // Split into term grades and note bundles by week
    final termGrades = pendingGrades.where((g) => g.gradeSource == 'calculator').toList();
    final noteGrades = pendingGrades.where((g) => g.gradeSource == 'notes').toList();

    final Map<DateTime, List<ChildQuickGrade>> notesByWeek = {};
    for (final g in noteGrades) {
      final ws = _rewardsWeekStart(g.gradedAt);
      notesByWeek.putIfAbsent(ws, () => []).add(g);
    }
    final sortedWeeks = notesByWeek.keys.toList()..sort((a, b) => b.compareTo(a));

    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: cs.shadow.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Child header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text(
                    child.childName.substring(0, 1).toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  child.childName,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface),
                ),
                const Spacer(),
                if (totalPts > 0)
                  Text(
                    '$totalPts ${l10n.ptsAbbr}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.tierBest),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Divider(height: 1, color: cs.outlineVariant),

          if (pendingGrades.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(l10n.rewardsNoPendingGrades, style: TextStyle(color: cs.onSurfaceVariant)),
            )
          else ...[
            // Term grades group
            if (termGrades.isNotEmpty)
              _GroupSection(
                label: l10n.rewardsSectionTermGrades,
                grades: termGrades,
                child: child,
              ),
            // Notes grouped by week
            for (final ws in sortedWeeks)
              _GroupSection(
                label: l10n.rewardsSectionNotesWeek(_rewardsWeekLabel(ws)),
                grades: notesByWeek[ws]!,
                child: child,
              ),
          ],
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _GroupSection extends ConsumerWidget {
  final String label;
  final List<ChildQuickGrade> grades;
  final ChildWithGrades child;

  const _GroupSection({
    required this.label,
    required this.grades,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final groupPts = grades.fold<int>(0, (s, g) => s + g.bonusPoints);
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.5),
          ),
        ),
        ...grades.map((g) => _GradeRow(grade: g, onTap: () => GoRouter.of(context).push('/parent/children/${child.childId}'))),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => _showGroupSettleSheet(context, ref, groupPts),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
              child: Text(l10n.rewardsSettleAmount(groupPts), style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
        ),
        Divider(height: 1, color: cs.outlineVariant),
      ],
    );
  }

  void _showGroupSettleSheet(BuildContext context, WidgetRef ref, int total) {
    final l10n = AppLocalizations.of(context)!;
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetCtx) {
        bool settling = false;
        return StatefulBuilder(builder: (sheetCtx, setSheet) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.rewardsGroupSettleBonusFor(label, child.childName),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(sheetCtx).colorScheme.onSurface),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.tierBestLight, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(l10n.rewardsAmountToTransfer, style: TextStyle(color: Theme.of(sheetCtx).colorScheme.onSurface, fontWeight: FontWeight.w500)),
                    Text('$total ${l10n.ptsAbbr}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.tierBest)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: settling ? null : () => Navigator.of(sheetCtx).pop(),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: Theme.of(sheetCtx).colorScheme.outlineVariant),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(l10n.rewardsCancel, style: TextStyle(color: Theme.of(sheetCtx).colorScheme.onSurface)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: settling ? null : () async {
                        setSheet(() => settling = true);
                        try {
                          final quickIds = grades.where((g) => g.gradeSource == 'notes').map((g) => g.id).toList();
                          final subjectIds = grades.where((g) => g.gradeSource == 'calculator').map((g) => g.id).toList();
                          await ref.read(gradeServiceProvider).createSettlement(
                            childId: child.childId,
                            amount: total,
                            quickGradeIds: quickIds,
                            subjectGradeIds: subjectIds,
                          );
                          if (sheetCtx.mounted) Navigator.of(sheetCtx).pop();
                          ref.read(childrenQuickGradesProvider.notifier).reload();
                          ref.read(settlementsProvider.notifier).reload();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(l10n.rewardsSettled), backgroundColor: AppColors.tierBest),
                            );
                          }
                        } catch (e) {
                          setSheet(() => settling = false);
                          if (sheetCtx.mounted) {
                            ScaffoldMessenger.of(sheetCtx).showSnackBar(
                              SnackBar(content: Text(AppLocalizations.of(sheetCtx)!.genericFailedError(e.toString())), backgroundColor: AppColors.error),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: settling
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(l10n.rewardsConfirmSettle, style: const TextStyle(fontWeight: FontWeight.w700)),
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
    final isTerm = grade.gradeSource == 'calculator';

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
              grade.subjectName ?? AppLocalizations.of(context)!.subjectFallback,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          if (isTerm) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondaryContainer,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                AppLocalizations.of(context)!.rewardsBadgeTerm,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSecondaryContainer,
                ),
              ),
            ),
            const SizedBox(width: 6),
          ],
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: tierColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${AppLocalizations.of(context)!.calculatorGradeLabel} ${grade.gradeValue}',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: tierColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            '+${grade.bonusPoints} ${AppLocalizations.of(context)!.ptsAbbr}',
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
      return Center(
        child: Text(AppLocalizations.of(context)!.rewardsNoChildrenConnected,
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
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
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: Theme.of(ctx).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppLocalizations.of(context)!.rewardsSummarySubtitle(child.grades.length, totalPts),
                        style: TextStyle(
                            fontSize: 13, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
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
                    '$pending ${AppLocalizations.of(context)!.ptsAbbr}',
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

class _HistoryTab extends ConsumerWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final settlementsAsync = ref.watch(settlementsProvider);

    return settlementsAsync.when(
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(l10n.rewardsFailedToLoadData,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => ref.read(settlementsProvider.notifier).reload(),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white),
                child: Text(l10n.rewardsRetry),
              ),
            ],
          ),
        ),
      ),
      data: (settlements) {
        if (settlements.isEmpty) {
          return Center(
            child: Text(l10n.rewardsHistoryEmpty,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: settlements.length,
          itemBuilder: (ctx, i) {
            final s = settlements[i];
            final dateStr = DateFormat('MMM d, yyyy').format(s.createdAt.toLocal());
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              clipBehavior: Clip.antiAlias,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        (s.childName ?? '?').substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.childName ?? l10n.nameUnknown,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: Theme.of(ctx).colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            dateStr,
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.tierBestLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '+${s.amount} ${l10n.ptsAbbr}',
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
            );
          },
        );
      },
    );
  }
}
