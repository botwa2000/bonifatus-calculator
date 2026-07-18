import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/child_data.dart';
import '../providers/children_provider.dart';
import '../../../api/services/grade_service.dart';

// ── helpers ───────────────────────────────────────────────────────────────────

DateTime _weekStart(DateTime d) {
  final local = d.toLocal();
  final day = DateTime(local.year, local.month, local.day);
  // Monday-based week (Dart weekday: 1=Mon … 7=Sun)
  return day.subtract(Duration(days: day.weekday - 1));
}

String _weekLabel(DateTime ws) {
  final we = ws.add(const Duration(days: 6));
  final fmt = DateFormat.MMM();
  return ws.month == we.month
      ? '${fmt.format(ws)} ${ws.day}–${we.day}'
      : '${fmt.format(ws)} ${ws.day} – ${fmt.format(we)} ${we.day}';
}

String _relativeDate(DateTime dt, AppLocalizations l10n) {
  final days = DateTime.now().difference(dt).inDays;
  if (days == 0) return l10n.insightsToday;
  if (days == 1) return l10n.insightsYesterday;
  return l10n.insightsDaysAgo(days);
}

// ── data shapes ───────────────────────────────────────────────────────────────

typedef _GradeEntry = ({ChildWithGrades child, ChildQuickGrade grade});

class _NoteBundle {
  final ChildWithGrades child;
  final DateTime weekStart;
  final List<ChildQuickGrade> notes;

  _NoteBundle({required this.child, required this.weekStart, required this.notes});

  int get totalPts => notes.fold(0, (s, g) => s + g.bonusPoints);
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

          // Unsettled calculator (subject) grades — settle per test result
          final unsettledCalc = allGrades
              .where((e) =>
                  e.grade.settlementStatus == 'unsettled' &&
                  e.grade.gradeSource == 'calculator')
              .toList();

          // Unsettled notes — bundle by child + Monday-week
          final noteBundles = _buildNoteBundles(
            allGrades.where((e) =>
                e.grade.settlementStatus == 'unsettled' &&
                e.grade.gradeSource == 'notes'),
          );

          final totalUnsettledPts =
              unsettledCalc.fold<int>(0, (s, e) => s + e.grade.bonusPoints) +
              noteBundles.fold<int>(0, (s, b) => s + b.totalPts);
          final totalUnsettledItems = unsettledCalc.length + noteBundles.length;

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

                if (unsettledCalc.isNotEmpty || noteBundles.isNotEmpty) ...[
                  SliverToBoxAdapter(child: _SectionHeader(label: l10n.insightsReadyToSettle)),
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) {
                        if (i < unsettledCalc.length) {
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                            child: _CalcGradeRow(
                              child: unsettledCalc[i].child,
                              grade: unsettledCalc[i].grade,
                            ),
                          );
                        }
                        final b = noteBundles[i - unsettledCalc.length];
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                          child: _NoteBundleRow(bundle: b),
                        );
                      },
                      childCount: unsettledCalc.length + noteBundles.length,
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

  static List<_NoteBundle> _buildNoteBundles(Iterable<_GradeEntry> notes) {
    final map = <String, _NoteBundle>{};
    for (final e in notes) {
      final ws = _weekStart(e.grade.gradedAt);
      final key = '${e.child.childId}__${ws.millisecondsSinceEpoch}';
      if (map.containsKey(key)) {
        map[key]!.notes.add(e.grade);
      } else {
        map[key] = _NoteBundle(child: e.child, weekStart: ws, notes: [e.grade]);
      }
    }
    return map.values.toList()
      ..sort((a, b) {
        final cmp = b.weekStart.compareTo(a.weekStart);
        return cmp != 0 ? cmp : a.child.childName.compareTo(b.child.childName);
      });
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
  final int unsettledPts, unsettledCount, childCount;
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
          Expanded(child: _BannerStat(value: '$unsettledPts', unit: l10n.ptsAbbr, label: l10n.insightsPendingPts)),
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

// ── calculator grade row ──────────────────────────────────────────────────────

class _CalcGradeRow extends ConsumerWidget {
  final ChildWithGrades child;
  final ChildQuickGrade grade;
  const _CalcGradeRow({required this.child, required this.grade});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);

    return _SettleRow(
      avatar: child.childName[0].toUpperCase(),
      avatarColor: AppColors.tierColor(child.latestTier),
      avatarBg: AppColors.tierColorLight(child.latestTier),
      topLabel: child.childName,
      mainLabel: grade.subjectName ?? l10n.subjectFallback,
      badgeText: '${l10n.calculatorGradeLabel} ${grade.gradeValue}',
      badgeColor: tierColor,
      pts: grade.bonusPoints,
      onSettle: () => _showSheet(context, ref, l10n),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _SettleSheet(
        title: l10n.rewardsSettleBonusFor(child.childName),
        subtitle: '${grade.subjectName ?? l10n.subjectFallback}  ·  ${l10n.calculatorGradeLabel} ${grade.gradeValue}',
        pts: grade.bonusPoints,
        onConfirm: () => ref.read(gradeServiceProvider).createSettlement(
          childId: child.childId,
          amount: grade.bonusPoints,
          subjectGradeIds: [grade.id],
        ),
        onDone: () {
          ref.read(childrenQuickGradesProvider.notifier).reload();
          ref.read(settlementsProvider.notifier).reload();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(l10n.rewardsSettled),
              backgroundColor: AppColors.tierBest,
            ));
          }
        },
      ),
    );
  }
}

// ── note bundle row ───────────────────────────────────────────────────────────

class _NoteBundleRow extends ConsumerWidget {
  final _NoteBundle bundle;
  const _NoteBundleRow({required this.bundle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final count = bundle.notes.length;
    final label = '$count ${count == 1 ? l10n.insightsNote : l10n.insightsNotes}  ·  ${_weekLabel(bundle.weekStart)}';

    return _SettleRow(
      avatar: bundle.child.childName[0].toUpperCase(),
      avatarColor: AppColors.tierColor(bundle.child.latestTier),
      avatarBg: AppColors.tierColorLight(bundle.child.latestTier),
      topLabel: bundle.child.childName,
      mainLabel: label,
      pts: bundle.totalPts,
      onSettle: () => _showSheet(context, ref, l10n),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    final count = bundle.notes.length;
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _SettleSheet(
        title: l10n.rewardsSettleBonusFor(bundle.child.childName),
        subtitle: '$count ${count == 1 ? l10n.insightsNote : l10n.insightsNotes}  ·  ${_weekLabel(bundle.weekStart)}',
        pts: bundle.totalPts,
        onConfirm: () => ref.read(gradeServiceProvider).createSettlement(
          childId: bundle.child.childId,
          amount: bundle.totalPts,
          quickGradeIds: bundle.notes.map((g) => g.id).toList(),
        ),
        onDone: () {
          ref.read(childrenQuickGradesProvider.notifier).reload();
          ref.read(settlementsProvider.notifier).reload();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(l10n.rewardsSettled),
              backgroundColor: AppColors.tierBest,
            ));
          }
        },
      ),
    );
  }
}

// ── shared settle row ─────────────────────────────────────────────────────────

class _SettleRow extends StatelessWidget {
  final String avatar, topLabel, mainLabel;
  final Color avatarColor, avatarBg;
  final String? badgeText;
  final Color? badgeColor;
  final int pts;
  final VoidCallback onSettle;

  const _SettleRow({
    required this.avatar,
    required this.avatarColor,
    required this.avatarBg,
    required this.topLabel,
    required this.mainLabel,
    this.badgeText,
    this.badgeColor,
    required this.pts,
    required this.onSettle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: avatarBg, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(avatar, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: avatarColor)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(topLabel,
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 1),
                Text(mainLabel,
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          if (badgeText != null && badgeColor != null) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: badgeColor!.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(badgeText!,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: badgeColor)),
            ),
          ],
          const SizedBox(width: 8),
          FilledButton(
            onPressed: onSettle,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.tierBestLight,
              foregroundColor: AppColors.tierBest,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: Text(l10n.rewardsSettleAmount(pts),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── shared settle sheet ───────────────────────────────────────────────────────

class _SettleSheet extends StatefulWidget {
  final String title, subtitle;
  final int pts;
  final Future<void> Function() onConfirm;
  final VoidCallback onDone;

  const _SettleSheet({
    required this.title,
    required this.subtitle,
    required this.pts,
    required this.onConfirm,
    required this.onDone,
  });

  @override
  State<_SettleSheet> createState() => _SettleSheetState();
}

class _SettleSheetState extends State<_SettleSheet> {
  bool _settling = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.title,
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(widget.subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
                Text(l10n.rewardsAmountToTransfer,
                    style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.w500)),
                Text('+${widget.pts} ${l10n.ptsAbbr}',
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.tierBest)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _settling ? null : () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: theme.colorScheme.outlineVariant),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(l10n.rewardsCancel, style: TextStyle(color: theme.colorScheme.onSurface)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _settling
                    ? null
                    : () async {
                        setState(() => _settling = true);
                        final nav = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        final errPrefix = AppLocalizations.of(context)!.genericFailedError('');
                        try {
                          await widget.onConfirm();
                          if (!mounted) return;
                          nav.pop();
                          widget.onDone();
                        } catch (e) {
                          if (!mounted) return;
                          setState(() => _settling = false);
                          messenger.showSnackBar(SnackBar(
                            content: Text('$errPrefix${e.toString()}'),
                            backgroundColor: AppColors.error,
                          ));
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _settling
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(l10n.rewardsConfirmSettle,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ],
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
              Text('+${grade.bonusPoints} ${l10n.ptsAbbr}',
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
