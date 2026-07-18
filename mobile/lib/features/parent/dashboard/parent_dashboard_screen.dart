import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../api/services/grade_service.dart';

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
              Text(
                l10n.homeActionCenterSubtitle,
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
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

    final totalUnsettledPts = allUnsettled.fold<int>(0, (s, e) => s + e.grade.bonusPoints);

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
              onGoToInsights: () => context.go('/parent/insights'),
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
                child: _ActiveChildRow(child: child, l10n: l10n),
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
  final int pts, count;
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
                      l10n.homeUnsettledBannerTitle(pts),
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
                  l10n.homeGoToInsights,
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
                  grade.subjectName ?? l10n.subjectFallback,
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: tierColorLight, borderRadius: BorderRadius.circular(6)),
            child: Text(
              grade.gradeSource == 'calculator'
                  ? '${l10n.calculatorGradeLabel} ${grade.gradeValue}'
                  : grade.gradeValue,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: tierColor),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: () => _showSettleSheet(context, ref, l10n),
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
              l10n.rewardsSettleAmount(grade.bonusPoints),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  void _showSettleSheet(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    final grade = entry.grade;
    final child = entry.child;
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _QuickSettleSheet(
        title: l10n.rewardsSettleBonusFor(child.childName),
        subtitle: grade.subjectName ?? l10n.subjectFallback,
        pts: grade.bonusPoints,
        onConfirm: () async {
          if (grade.gradeSource == 'calculator') {
            await ref.read(gradeServiceProvider).createSettlement(
              childId: child.childId,
              amount: grade.bonusPoints,
              subjectGradeIds: [grade.id],
            );
          } else {
            await ref.read(gradeServiceProvider).createSettlement(
              childId: child.childId,
              amount: grade.bonusPoints,
              quickGradeIds: [grade.id],
            );
          }
        },
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

class _QuickSettleSheet extends StatefulWidget {
  final String title, subtitle;
  final int pts;
  final Future<void> Function() onConfirm;
  final VoidCallback onDone;
  const _QuickSettleSheet({
    required this.title,
    required this.subtitle,
    required this.pts,
    required this.onConfirm,
    required this.onDone,
  });

  @override
  State<_QuickSettleSheet> createState() => _QuickSettleSheetState();
}

class _QuickSettleSheetState extends State<_QuickSettleSheet> {
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
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
                    style: TextStyle(
                        color: theme.colorScheme.onSurface, fontWeight: FontWeight.w500)),
                Text(
                  '+${widget.pts} ${l10n.ptsAbbr}',
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.tierBest),
                ),
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
                child: Text(l10n.rewardsCancel,
                    style: TextStyle(color: theme.colorScheme.onSurface)),
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
                        final errPrefix =
                            AppLocalizations.of(context)!.genericFailedError('');
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
                        width: 20,
                        height: 20,
                        child:
                            CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
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

// ── active child row ──────────────────────────────────────────────────────────

class _ActiveChildRow extends StatelessWidget {
  final ChildWithGrades child;
  final AppLocalizations l10n;
  const _ActiveChildRow({required this.child, required this.l10n});

  @override
  Widget build(BuildContext context) {
    final sorted = [...child.grades]..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    final latest = sorted.first;
    final tierColor = AppColors.tierColor(latest.gradeQualityTier);
    final tierColorLight = AppColors.tierColorLight(latest.gradeQualityTier);
    final theme = Theme.of(context);
    final daysAgo = DateTime.now().difference(latest.gradedAt).inDays;
    final timeLabel = daysAgo == 0 ? l10n.insightsToday : l10n.insightsYesterday;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4)),
      ),
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
                  fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(child.childName,
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                Text(
                  '${latest.subjectName ?? l10n.subjectFallback}  ·  $timeLabel',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration:
                BoxDecoration(color: tierColorLight, borderRadius: BorderRadius.circular(6)),
            child: Text(
              latest.gradeSource == 'calculator'
                  ? '${l10n.calculatorGradeLabel} ${latest.gradeValue}'
                  : latest.gradeValue,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: tierColor),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '+${latest.bonusPoints} ${l10n.ptsAbbr}',
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.tierBest),
          ),
        ],
      ),
    );
  }
}
