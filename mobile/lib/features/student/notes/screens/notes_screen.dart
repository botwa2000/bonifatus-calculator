import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/quick_grades_provider.dart';
import '../../../../models/quick_grade.dart';

class _WeekGroup {
  final String weekKey; // ISO "YYYY-MM-DD" of Monday
  final String label;
  final List<QuickGrade> grades;

  const _WeekGroup({
    required this.weekKey,
    required this.label,
    required this.grades,
  });
}

DateTime _weekStart(DateTime date) {
  final d = DateTime(date.year, date.month, date.day);
  return d.subtract(Duration(days: d.weekday - 1));
}

List<_WeekGroup> _groupByWeek(
    List<QuickGrade> grades, String thisWeekStr, String lastWeekStr) {
  final map = <String, List<QuickGrade>>{};
  for (final g in grades) {
    final ws = _weekStart(g.gradedAt);
    final key =
        '${ws.year}-${ws.month.toString().padLeft(2, '0')}-${ws.day.toString().padLeft(2, '0')}';
    (map[key] ??= []).add(g);
  }

  final now = DateTime.now();
  final thisWeekStart = _weekStart(now);

  return map.entries.map((e) {
    final ws = DateTime.parse(e.key);
    final we = ws.add(const Duration(days: 6));
    final fmt = DateFormat('MMM d');
    final diff = thisWeekStart.difference(ws).inDays;
    String label;
    if (diff == 0) {
      label = '$thisWeekStr — ${fmt.format(ws)}–${fmt.format(we)}';
    } else if (diff == 7) {
      label = '$lastWeekStr — ${fmt.format(ws)}–${fmt.format(we)}';
    } else {
      label = '${fmt.format(ws)} – ${fmt.format(we)}';
    }
    final sorted = [...e.value]
      ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
    return _WeekGroup(weekKey: e.key, label: label, grades: sorted);
  }).toList()
    ..sort((a, b) => b.weekKey.compareTo(a.weekKey));
}

class NotesScreen extends ConsumerWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final gradesAsync = ref.watch(quickGradesProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          l10n.notesTitle,
          style: const TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded,
                color: AppColors.primary),
            onPressed: () => context.push('/student/notes/capture'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => context.push('/student/notes/capture'),
        child: const Icon(Icons.add_rounded),
      ),
      body: gradesAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AppColors.primary)),
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
                  l10n.notesFailedToLoad,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.neutral900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  err.toString(),
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.neutral600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () =>
                      ref.read(quickGradesProvider.notifier).reload(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                  ),
                  child: Text(l10n.notesRetry),
                ),
              ],
            ),
          ),
        ),
        data: (grades) {
          if (grades.isEmpty) return _buildEmptyState(context, l10n);
          final groups =
              _groupByWeek(grades, l10n.notesThisWeek, l10n.notesLastWeek);
          return _buildContent(context, ref, l10n, groups);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: const BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.photo_camera_outlined,
                size: 56,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              l10n.notesNoNotesYet,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.notesTapToCaptureFirst,
              style: const TextStyle(fontSize: 15, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref,
      AppLocalizations l10n, List<_WeekGroup> groups) {
    final currentGroup = groups.first;
    final totalBonusPts =
        currentGroup.grades.fold<double>(0.0, (sum, g) => sum + g.bonusPoints);

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SummaryChipRow(
              totalNotes: currentGroup.grades.length,
              totalBonusPts: totalBonusPts,
              netPts: totalBonusPts,
              weekKey: currentGroup.weekKey,
              viewCycleSummaryLabel: l10n.notesViewCycleSummary,
            ),
          ),
        ),
        for (final group in groups) ...[
          SliverPersistentHeader(
            pinned: true,
            delegate: _SectionHeaderDelegate(group.label),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) {
                final grade = group.grades[i];
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Dismissible(
                    key: Key(grade.id),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 20),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.delete_outline_rounded,
                          color: Colors.white, size: 24),
                    ),
                    confirmDismiss: (_) async {
                      return await showDialog<bool>(
                            context: ctx,
                            builder: (dCtx) {
                              final dl10n = AppLocalizations.of(dCtx)!;
                              return AlertDialog(
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16)),
                                title: Text(dl10n.notesDeleteGradeTitle),
                                content: Text(dl10n.notesDeleteGradeConfirm),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.of(dCtx).pop(false),
                                    child: Text(dl10n.notesCancel),
                                  ),
                                  ElevatedButton(
                                    onPressed: () =>
                                        Navigator.of(dCtx).pop(true),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.error,
                                      foregroundColor: AppColors.white,
                                    ),
                                    child: Text(dl10n.notesDelete),
                                  ),
                                ],
                              );
                            },
                          ) ??
                          false;
                    },
                    onDismissed: (_) {
                      ref
                          .read(quickGradesProvider.notifier)
                          .deleteGrade(grade.id);
                    },
                    child: _NoteCard(
                      grade: grade,
                      onTap: () =>
                          context.push('/student/notes/detail/${grade.id}'),
                    ),
                  ),
                );
              },
              childCount: group.grades.length,
            ),
          ),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }
}

class _SummaryChipRow extends StatelessWidget {
  final int totalNotes;
  final double totalBonusPts;
  final double netPts;
  final String weekKey;
  final String viewCycleSummaryLabel;

  const _SummaryChipRow({
    required this.totalNotes,
    required this.totalBonusPts,
    required this.netPts,
    required this.weekKey,
    required this.viewCycleSummaryLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Chip(
                label: '$totalNotes notes',
                icon: Icons.note_alt_outlined,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              _Chip(
                label: '+${totalBonusPts % 1 == 0 ? totalBonusPts.toInt() : totalBonusPts.toStringAsFixed(1)} pts',
                icon: Icons.star_outline_rounded,
                color: AppColors.tierBest,
              ),
              const SizedBox(width: 8),
              _Chip(
                label: 'Net: ${netPts % 1 == 0 ? netPts.toInt() : netPts.toStringAsFixed(1)} pts',
                icon: Icons.account_balance_wallet_outlined,
                color: netPts >= 0 ? AppColors.tierBest : AppColors.tierBelow,
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () =>
                  context.push('/student/notes/cycle/$weekKey'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                viewCycleSummaryLabel,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _Chip({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  final QuickGrade grade;
  final VoidCallback onTap;

  const _NoteCard({required this.grade, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(grade.gradeQualityTier);
    final tierColorLight = AppColors.tierColorLight(grade.gradeQualityTier);
    final dateStr = DateFormat('MMM d').format(grade.gradedAt);
    final subjectLabel = grade.subjectName ?? 'Subject';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.neutral900.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 6,
              height: 72,
              decoration: BoxDecoration(
                color: tierColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  bottomLeft: Radius.circular(14),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            subjectLabel,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: AppColors.neutral900,
                            ),
                          ),
                          const SizedBox(height: 4),
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: tierColorLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Grade ${grade.gradeValue}',
                            style: TextStyle(
                              color: tierColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '+${grade.bonusPoints % 1 == 0 ? grade.bonusPoints.toInt() : grade.bonusPoints.toStringAsFixed(1)} pts',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.tierBest,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 14),
          ],
        ),
      ),
    );
  }
}

class _SectionHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String title;

  _SectionHeaderDelegate(this.title);

  @override
  double get minExtent => 44;

  @override
  double get maxExtent => 44;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: AppColors.neutral50,
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.neutral600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _SectionHeaderDelegate oldDelegate) =>
      title != oldDelegate.title;
}
