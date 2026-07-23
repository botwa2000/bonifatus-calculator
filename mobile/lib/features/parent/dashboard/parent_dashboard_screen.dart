import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../utils/format_utils.dart';
import '../../../../utils/term_type_utils.dart';

typedef _Entry = ({ChildWithGrades child, ChildQuickGrade grade});

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final authAsync = ref.watch(authStateNotifierProvider);
    final userName = authAsync.valueOrNull?.name ?? l10n.parentFallback;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(childrenQuickGradesProvider.notifier).reload(),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _Header(userName: userName, l10n: l10n),
                ),
              ),
              SliverToBoxAdapter(
                child: childrenAsync.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.only(top: 60),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  ),
                  error: (_, __) => Padding(
                    padding: const EdgeInsets.fromLTRB(20, 40, 20, 0),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            l10n.parentDashboardCouldNotLoadChildren,
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          TextButton(
                            onPressed: () => ref.read(childrenQuickGradesProvider.notifier).reload(),
                            child: Text(l10n.genericRetry),
                          ),
                        ],
                      ),
                    ),
                  ),
                  data: (children) => _ActionCenter(children: children),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final String userName;
  final AppLocalizations l10n;
  const _Header({required this.userName, required this.l10n});

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.parentDashboardHiName(userName),
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
            child: const Icon(Icons.notifications_none_rounded, color: AppColors.primary),
          ),
        ],
      );
}

// ── action center ─────────────────────────────────────────────────────────────

class _ActionCenter extends ConsumerWidget {
  final List<ChildWithGrades> children;
  const _ActionCenter({required this.children});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    if (children.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 40, 20, 0),
        child: Center(
          child: Text(
            l10n.parentDashboardNoChildrenConnected,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    final allUnsettled = children
        .expand((c) => c.grades
            .where((g) => g.settlementStatus == 'unsettled')
            .map<_Entry>((g) => (child: c, grade: g)))
        .toList();

    final totalUnsettledPts = allUnsettled.fold<double>(0.0, (s, e) => s + e.grade.bonusPoints);

    _Entry? topPending;
    if (allUnsettled.isNotEmpty) {
      topPending = allUnsettled
          .reduce((a, b) => a.grade.bonusPoints >= b.grade.bonusPoints ? a : b);
    }

    final cutoff = DateTime.now().subtract(const Duration(hours: 24));
    final activeToday = children
        .where((c) => c.grades.any((g) => g.gradedAt.isAfter(cutoff)))
        .toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Unsettled banner or all-clear
          if (allUnsettled.isNotEmpty) ...[
            _UnsettledBanner(
              pts: totalUnsettledPts,
              count: allUnsettled.length,
              l10n: l10n,
              onGoToInsights: () => context.go('/parent/settle'),
            ),
            const SizedBox(height: 16),
          ] else ...[
            _AllSettledCard(l10n: l10n),
            const SizedBox(height: 16),
          ],

          // Quick-settle for the highest pending item
          if (topPending != null) ...[
            _SectionLabel(l10n.homeTopPendingSection),
            const SizedBox(height: 8),
            _QuickSettleCard(entry: topPending),
            const SizedBox(height: 20),
          ],

          // Active today
          _SectionLabel(l10n.homeActiveTodaySection),
          const SizedBox(height: 8),
          if (activeToday.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                l10n.homeActiveTodayEmpty,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 14,
                ),
              ),
            )
          else
            for (final child in activeToday)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _ChildCard(child: child),
              ),
        ],
      ),
    );
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      );
}

// ── unsettled banner ──────────────────────────────────────────────────────────

class _UnsettledBanner extends StatelessWidget {
  final double pts;
  final int count;
  final AppLocalizations l10n;
  final VoidCallback onGoToInsights;
  const _UnsettledBanner({
    required this.pts,
    required this.count,
    required this.l10n,
    required this.onGoToInsights,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onGoToInsights,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, Color(0xFF6B4EFF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.account_balance_wallet_outlined, color: Colors.white70, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.homeUnsettledBannerTitle(ptsPrecise(pts)),
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.homeUnsettledBannerSub(count),
                      style: const TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  l10n.settleTitle,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}

// ── all-settled card ──────────────────────────────────────────────────────────

class _AllSettledCard extends StatelessWidget {
  final AppLocalizations l10n;
  const _AllSettledCard({required this.l10n});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.tierBestLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.tierBest, size: 22),
            const SizedBox(width: 10),
            Text(
              l10n.homeAllSettledUp,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.tierBest,
              ),
            ),
          ],
        ),
      );
}

// ── quick-settle card ─────────────────────────────────────────────────────────

class _QuickSettleCard extends ConsumerWidget {
  final _Entry entry;
  const _QuickSettleCard({required this.entry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final child = entry.child;
    final grade = entry.grade;
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);
    final tierColorLight = AppColors.tierColorLight(grade.gradeQualityTier);
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(
              child.childName[0].toUpperCase(),
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  child.childName,
                  style: theme.textTheme.labelSmall
                      ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 2),
                Text(
                  grade.gradeSource == 'calculator'
                      ? localizeTermLabel(l10n, grade.rawTermType ?? '', grade.termSchoolYear ?? '', grade.termName)
                      : (grade.subjectName ?? l10n.subjectFallback),
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: grade.gradeSource == 'calculator' ? AppColors.primaryLight : tierColorLight,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              grade.gradeSource == 'calculator'
                  ? localizeTermType(l10n, grade.rawTermType ?? '')
                  : grade.gradeValue,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: grade.gradeSource == 'calculator' ? AppColors.primary : tierColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: () => context.go('/parent/settle'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.tierBestLight,
              foregroundColor: AppColors.tierBest,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: Text(
              l10n.settleTitle,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

}

// ── active child card (with period toggle) ────────────────────────────────────

enum _DashPeriod { week, month, allTime }

class _ChildCard extends StatefulWidget {
  final ChildWithGrades child;
  const _ChildCard({required this.child});
  @override
  State<_ChildCard> createState() => _ChildCardState();
}

class _ChildCardState extends State<_ChildCard> {
  _DashPeriod _period = _DashPeriod.week;

  List<ChildQuickGrade> _filtered(DateTime now) {
    final g = widget.child.grades;
    return switch (_period) {
      _DashPeriod.week => () {
          final wStart = DateTime(now.year, now.month, now.day - (now.weekday - 1));
          return g.where((e) => !e.gradedAt.isBefore(wStart)).toList();
        }(),
      _DashPeriod.month =>
        g.where((e) => e.gradedAt.year == now.year && e.gradedAt.month == now.month).toList(),
      _DashPeriod.allTime => g,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final child = widget.child;
    final sorted = [...child.grades]..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    final notesSorted = sorted.where((g) => g.gradeSource == 'notes').toList();
    final latest = notesSorted.isNotEmpty ? notesSorted.first : sorted.first;
    final tierColor = AppColors.tierColor(latest.gradeQualityTier);
    final tierColorLight = AppColors.tierColorLight(latest.gradeQualityTier);
    final theme = Theme.of(context);
    final now = DateTime.now();
    final filteredAll = _filtered(now);
    final filtered = filteredAll.where((g) => g.gradeSource == 'notes').toList();
    final totalPts = filtered.fold<double>(0.0, (s, g) => s + g.bonusPoints);

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: const BoxDecoration(
                    color: AppColors.primaryLight, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: Text(
                  child.childName[0].toUpperCase(),
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(child.childName,
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration:
                    BoxDecoration(color: tierColorLight, borderRadius: BorderRadius.circular(6)),
                child: Text(
                  latest.gradeSource == 'calculator'
                      ? '${l10n.calculatorGradeLabel} ${latest.gradeValue}'
                      : latest.gradeValue,
                  style: TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700, color: tierColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SegmentedButton<_DashPeriod>(
            style: SegmentedButton.styleFrom(
              textStyle: const TextStyle(fontSize: 11),
              visualDensity: VisualDensity.compact,
            ),
            segments: [
              ButtonSegment(value: _DashPeriod.week, label: Text(l10n.periodWeek)),
              ButtonSegment(value: _DashPeriod.month, label: Text(l10n.periodMonth)),
              ButtonSegment(value: _DashPeriod.allTime, label: Text(l10n.periodAllTime)),
            ],
            selected: {_period},
            onSelectionChanged: (sel) => setState(() => _period = sel.first),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.school_outlined, size: 14, color: AppColors.primary),
              const SizedBox(width: 4),
              Text(
                l10n.homeChildGrades(filtered.length),
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.star_outline_rounded, size: 14, color: AppColors.tierBest),
              const SizedBox(width: 4),
              Text(
                l10n.homeChildPts(ptsPrecise(totalPts)),
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.tierBest),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
