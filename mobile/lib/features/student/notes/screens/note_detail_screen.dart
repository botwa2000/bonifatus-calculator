import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/quick_grades_provider.dart';

class NoteDetailScreen extends ConsumerWidget {
  final String noteId;

  const NoteDetailScreen({super.key, required this.noteId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final gradesAsync = ref.watch(quickGradesProvider);

    return gradesAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          title: Text(l10n.noteDetailTitle),
          elevation: 0,
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
          title: Text(l10n.noteDetailTitle),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
            child: Text(l10n.noteDetailCouldNotLoad,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant))),
      ),
      data: (grades) {
        final grade = grades.where((g) => g.id == noteId).firstOrNull;
        if (grade == null) {
          return Scaffold(
            appBar: AppBar(
              title: Text(l10n.noteDetailTitle),
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => context.pop(),
              ),
            ),
            body: Center(
              child: Text(l10n.noteDetailNotFound,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
          );
        }

        final tierColor = AppColors.tierColor(grade.gradeQualityTier);
        final tierColorLight =
            AppColors.tierColorLight(grade.gradeQualityTier);
        final dateStr =
            DateFormat('MMM d, yyyy').format(grade.gradedAt);
        final subjectLabel = grade.subjectName ?? AppLocalizations.of(context)!.subjectFallback;

        final cs = Theme.of(context).colorScheme;
        return Scaffold(
          appBar: AppBar(
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => context.pop(),
            ),
            title: Text(
              l10n.noteDetailTitle,
              style: TextStyle(
                color: cs.onSurface,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            actions: [
              if (grade.settlementStatus != 'settled')
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      color: AppColors.error),
                  onPressed: () => _showDeleteDialog(context, ref, l10n),
                ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: cs.shadow.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: tierColorLight,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              grade.gradeValue,
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: tierColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  subjectLabel,
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: cs.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.tierBest
                                        .withValues(alpha: 0.12),
                                    borderRadius:
                                        BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    '+${grade.bonusPoints % 1 == 0 ? grade.bonusPoints.toInt() : grade.bonusPoints.toStringAsFixed(1)} ${l10n.bonusPtsLabel}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.tierBest,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Divider(color: cs.outlineVariant),
                      const SizedBox(height: 16),
                      _DetailRow(
                        icon: Icons.schedule_rounded,
                        label: l10n.noteDetailDateCaptured,
                        value: dateStr,
                      ),
                      const SizedBox(height: 12),
                      _DetailRow(
                        icon: Icons.star_outline_rounded,
                        label: l10n.noteDetailQualityTier,
                        value: _tierLabel(grade.gradeQualityTier, l10n),
                      ),
                      const SizedBox(height: 12),
                      _DetailRow(
                        icon: Icons.account_balance_wallet_outlined,
                        label: l10n.noteDetailSettlement,
                        value: grade.settlementStatus == 'settled'
                            ? l10n.noteDetailSettled
                            : l10n.noteDetailPending,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _tierLabel(String tier, AppLocalizations l10n) {
    switch (tier) {
      case 'best':
        return l10n.noteDetailTier1;
      case 'second':
        return l10n.noteDetailTier2;
      case 'third':
        return l10n.noteDetailTier3;
      default:
        return l10n.noteDetailTierBelow;
    }
  }

  void _showDeleteDialog(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          l10n.noteDetailDeleteTitle,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        content: Text(l10n.noteDetailDeleteConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(l10n.noteDetailCancel),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref
                  .read(quickGradesProvider.notifier)
                  .deleteGrade(noteId);
              if (context.mounted) context.pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(l10n.noteDetailDelete),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 18, color: cs.onSurfaceVariant),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: cs.onSurfaceVariant,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: cs.onSurface,
          ),
        ),
      ],
    );
  }
}
