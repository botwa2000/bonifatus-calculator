import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/children_provider.dart';
import '../../../../models/child_data.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../utils/term_type_utils.dart';
import '../../../../utils/format_utils.dart';

List<ChildTermResult> _demoTermResults() => [
      ChildTermResult(
        id: 'tr1',
        schoolYear: '2024/25',
        termType: 'semester_2',
        classLevel: 7,
        totalBonusPoints: 14.0,
        createdAt: DateTime(2025, 6, 15),
        subjects: [
          ChildSubjectGrade(id: 'sg1', subjectNameMap: const {'en': 'Mathematics', 'de': 'Mathematik'}, gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4.0),
          ChildSubjectGrade(id: 'sg2', subjectNameMap: const {'en': 'German', 'de': 'Deutsch'}, gradeValue: '1', gradeQualityTier: 'best', bonusPoints: 4.0),
          ChildSubjectGrade(id: 'sg3', subjectNameMap: const {'en': 'English', 'de': 'Englisch'}, gradeValue: '3', gradeQualityTier: 'second', bonusPoints: 2.0),
          ChildSubjectGrade(id: 'sg4', subjectNameMap: const {'en': 'Physics', 'de': 'Physik'}, gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4.0),
        ],
      ),
      ChildTermResult(
        id: 'tr2',
        schoolYear: '2024/25',
        termType: 'semester_1',
        classLevel: 7,
        totalBonusPoints: 10.0,
        createdAt: DateTime(2025, 1, 20),
        subjects: [
          ChildSubjectGrade(id: 'sg5', subjectNameMap: const {'en': 'Mathematics', 'de': 'Mathematik'}, gradeValue: '3', gradeQualityTier: 'second', bonusPoints: 2.0),
          ChildSubjectGrade(id: 'sg6', subjectNameMap: const {'en': 'German', 'de': 'Deutsch'}, gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4.0),
          ChildSubjectGrade(id: 'sg7', subjectNameMap: const {'en': 'English', 'de': 'Englisch'}, gradeValue: '2', gradeQualityTier: 'best', bonusPoints: 4.0),
        ],
      ),
    ];

final childTermResultsProvider =
    FutureProvider.family<List<ChildTermResult>, String>((ref, childId) async {
  if (kIsWeb && kDebugMode) return _demoTermResults();
  final service = ref.read(connectionServiceProvider);
  return service.fetchChildTermResults(childId);
});

class ChildDetailScreen extends ConsumerWidget {
  final String childId;

  const ChildDetailScreen({super.key, required this.childId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return childrenAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          title: Text(l10n.childDetailTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(
          title: Text(l10n.childDetailTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text(l10n.childDetailCouldNotLoad,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ),
      ),
      data: (children) {
        final child =
            children.where((c) => c.childId == childId).firstOrNull;

        if (child == null) {
          return Scaffold(
            appBar: AppBar(
              title: Text(l10n.childDetailTitle),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => context.pop(),
              ),
            ),
            body: Center(
              child: Text(l10n.childDetailNotFound,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
          );
        }

        return _buildScreen(context, ref, child, l10n);
      },
    );
  }

  Widget _buildScreen(BuildContext context, WidgetRef ref, ChildWithGrades child, AppLocalizations l10n) {
    final sortedGrades = [...child.grades]
      ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));

    final termResultsAsync = ref.watch(childTermResultsProvider(childId));
    final termPts = termResultsAsync.valueOrNull
            ?.fold<double>(0.0, (s, t) => s + t.totalBonusPoints) ??
        0.0;
    final totalPts =
        child.grades.fold<double>(0.0, (s, g) => s + g.bonusPoints) + termPts;
    final pendingPts = child.totalPendingPoints;

    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        title: Text(
          child.childName,
          style: TextStyle(
            color: cs.onSurface,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: _buildSummaryCard(child, totalPts, pendingPts, l10n),
            ),
          ),

          // Term Results section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
              child: Row(
                children: [
                  Text(
                    l10n.childDetailTermResults,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface,
                    ),
                  ),
                  const SizedBox(width: 8),
                  termResultsAsync.when(
                    loading: () => const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                          color: AppColors.primary, strokeWidth: 2),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                    data: (terms) => terms.isNotEmpty
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              terms.length.toString(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),

          termResultsAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: SizedBox(
                height: 60,
                child:
                    Center(child: CircularProgressIndicator(color: AppColors.primary)),
              ),
            ),
            error: (_, __) => SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(l10n.childDetailCouldNotLoadTermResults,
                    style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
              ),
            ),
            data: (terms) => terms.isEmpty
                ? SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: Text(
                        l10n.childDetailNoTermResults,
                        style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _TermResultCard(term: terms[i]),
                        ),
                        childCount: terms.length,
                      ),
                    ),
                  ),
          ),

          // Quick Grades section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
              child: Text(
                l10n.childDetailQuickGrades,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
              ),
            ),
          ),

          if (sortedGrades.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Text(l10n.childDetailNoQuickGrades,
                    style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final grade = sortedGrades[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _GradeCard(grade: grade),
                    );
                  },
                  childCount: sortedGrades.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
      ChildWithGrades child, double totalPts, double pendingPts, AppLocalizations l10n) {
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
      child: Row(
        children: [
          Expanded(
            child: _Stat(
              icon: Icons.grade_outlined,
              label: l10n.childDetailGrades,
              value: child.grades.length.toString(),
            ),
          ),
          Container(
              width: 1, height: 50, color: Colors.white.withValues(alpha: 0.2)),
          Expanded(
            child: _Stat(
              icon: Icons.star_outline_rounded,
              label: l10n.childDetailTotalPts,
              value: fmtPts(totalPts),
            ),
          ),
          Container(
              width: 1, height: 50, color: Colors.white.withValues(alpha: 0.2)),
          Expanded(
            child: _Stat(
              icon: Icons.pending_outlined,
              label: l10n.childDetailPending,
              value: '${fmtPts(pendingPts)} ${l10n.ptsAbbr}',
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _Stat({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _TermResultCard extends StatelessWidget {
  final ChildTermResult term;

  const _TermResultCard({required this.term});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;
    final tier = term.tier;
    final tierColor = AppColors.tierColor(tier);
    final tierBgColor = AppColors.tierColorLight(tier);
    final primary = term.averagePrimary;
    final secondary = term.averageSecondary;
    final settled = term.settlementStatus == 'settled';
    final pts = term.totalBonusPoints;

    return ExpansionTile(
      tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
      collapsedShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant)),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.primary, width: 1.5)),
      backgroundColor: Theme.of(context).colorScheme.surface,
      collapsedBackgroundColor: Theme.of(context).colorScheme.surface,
      // Leading: average grade box
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(color: tierBgColor, borderRadius: BorderRadius.circular(10)),
        alignment: Alignment.center,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(primary, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: tierColor)),
            if (secondary != null)
              Text(secondary, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: tierColor.withValues(alpha: 0.75))),
          ],
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              localizeTermLabel(l10n, term.termType, term.schoolYear, term.termName),
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
            ),
          ),
          if (settled) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.tierBestLight, borderRadius: BorderRadius.circular(6)),
              child: Text(l10n.termSettledBadge,
                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.tierBest)),
            ),
          ],
        ],
      ),
      subtitle: Text(
        '${localizeTermType(l10n, term.termType)} · ${l10n.classLabel} ${term.classLevel} · ${l10n.calculatorSubjectsLabel(term.subjects.length)}',
        style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
      trailing: Text(
        '+${fmtPts(pts)} ${l10n.ptsAbbr}',
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.tierBest),
      ),
      children: [
        ...term.subjects.map((s) {
          final sTier = s.gradeQualityTier ?? 'below';
          final sTierColor = AppColors.tierColor(sTier);
          final sTierBg = AppColors.tierColorLight(sTier);
          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: sTierBg, borderRadius: BorderRadius.circular(8)),
                  alignment: Alignment.center,
                  child: Text(s.gradeValue ?? '—',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: sTierColor)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    s.localizedName(locale, fallback: l10n.subjectFallback),
                    style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ),
                Text('+${fmtPts(s.bonusPoints)} ${l10n.ptsAbbr}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.tierBest)),
              ],
            ),
          );
        }),
        // Summary row below subjects
        if (term.subjects.isNotEmpty) ...[
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${l10n.calculatorSubjectsLabel(term.subjects.length)}  ·  ${l10n.termDetailAverage}: $primary${secondary != null ? ' ($secondary)' : ''}',
                  style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              Text('+${fmtPts(pts)} ${l10n.ptsAbbr}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.tierBest)),
            ],
          ),
        ],
      ],
    );
  }
}

class _GradeCard extends StatelessWidget {
  final ChildQuickGrade grade;

  const _GradeCard({required this.grade});

  void _showDetail(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;
    final tier = grade.gradeQualityTier;
    final color = AppColors.tierColor(tier);
    final lightColor = AppColors.tierColorLight(tier);
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4,
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Row(children: [
            Container(width: 56, height: 56,
              decoration: BoxDecoration(color: lightColor, borderRadius: BorderRadius.circular(14)),
              alignment: Alignment.center,
              child: Text(grade.gradeValue,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color))),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(grade.localizedName(locale, fallback: l10n.subjectFallback),
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface)),
              Text(DateFormat('MMMM d, yyyy').format(grade.gradedAt),
                style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ])),
          ]),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: _DetailChip(label: l10n.childDetailBonus, value: '+${fmtPts(grade.bonusPoints)} ${l10n.ptsAbbr}', color: AppColors.tierBest, bg: AppColors.tierBestLight)),
            const SizedBox(width: 10),
            Expanded(child: _DetailChip(label: l10n.childDetailStatus,
              value: grade.settlementStatus == 'settled' ? l10n.childDetailSettled : l10n.childDetailPending,
              color: grade.settlementStatus == 'settled' ? AppColors.tierBest : AppColors.tierThird,
              bg: grade.settlementStatus == 'settled' ? AppColors.tierBestLight : AppColors.tierThirdLight)),
          ]),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;
    final tier = grade.gradeQualityTier;
    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);
    final dateStr = DateFormat('MMM d, yyyy').format(grade.gradedAt);

    return InkWell(
      onTap: () => _showDetail(context),
      borderRadius: BorderRadius.circular(14),
      child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.shadow.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
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
                  grade.localizedName(locale, fallback: l10n.subjectFallback),
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${fmtPts(grade.bonusPoints)} ${AppLocalizations.of(context)!.ptsAbbr}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.tierBest,
                ),
              ),
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: grade.settlementStatus == 'settled'
                      ? AppColors.tierBestLight
                      : AppColors.tierThirdLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  grade.settlementStatus == 'settled'
                      ? l10n.childDetailSettled
                      : l10n.childDetailPending,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: grade.settlementStatus == 'settled'
                        ? AppColors.tierBest
                        : AppColors.tierThird,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final String label, value;
  final Color color, bg;
  const _DetailChip({required this.label, required this.value, required this.color, required this.bg});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
    child: Column(children: [
      Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      const SizedBox(height: 2),
      Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
    ]),
  );
}
