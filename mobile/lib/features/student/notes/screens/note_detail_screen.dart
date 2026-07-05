import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/quick_grades_provider.dart';

class NoteDetailScreen extends ConsumerWidget {
  final String noteId;

  const NoteDetailScreen({super.key, required this.noteId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(quickGradesProvider);

    return gradesAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          title: const Text('Note Detail'),
          backgroundColor: AppColors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.neutral900),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(
          title: const Text('Note Detail'),
          backgroundColor: AppColors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.neutral900),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
            child: Text('Could not load note',
                style: TextStyle(color: AppColors.neutral600))),
      ),
      data: (grades) {
        final grade = grades.where((g) => g.id == noteId).firstOrNull;
        if (grade == null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Note Detail'),
              backgroundColor: AppColors.white,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.neutral900),
                onPressed: () => context.pop(),
              ),
            ),
            body: const Center(
              child: Text('Grade not found',
                  style: TextStyle(color: AppColors.neutral600)),
            ),
          );
        }

        final tierColor = AppColors.tierColor(grade.gradeQualityTier);
        final tierColorLight =
            AppColors.tierColorLight(grade.gradeQualityTier);
        final dateStr =
            DateFormat('MMM d, yyyy').format(grade.gradedAt);
        final subjectLabel = grade.subjectName ?? 'Subject';

        return Scaffold(
          backgroundColor: AppColors.neutral50,
          appBar: AppBar(
            backgroundColor: AppColors.white,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: AppColors.neutral900),
              onPressed: () => context.pop(),
            ),
            title: const Text(
              'Note Detail',
              style: TextStyle(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded,
                    color: AppColors.error),
                onPressed: () => _showDeleteDialog(context, ref),
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
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color:
                            AppColors.neutral900.withValues(alpha: 0.06),
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
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.neutral900,
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
                                    '+${grade.bonusPoints % 1 == 0 ? grade.bonusPoints.toInt() : grade.bonusPoints.toStringAsFixed(1)} bonus pts',
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
                      const Divider(color: AppColors.neutral100),
                      const SizedBox(height: 16),
                      _DetailRow(
                        icon: Icons.schedule_rounded,
                        label: 'Date Captured',
                        value: dateStr,
                      ),
                      const SizedBox(height: 12),
                      _DetailRow(
                        icon: Icons.star_outline_rounded,
                        label: 'Quality Tier',
                        value: _tierLabel(grade.gradeQualityTier),
                      ),
                      const SizedBox(height: 12),
                      _DetailRow(
                        icon: Icons.account_balance_wallet_outlined,
                        label: 'Settlement',
                        value: grade.settlementStatus == 'settled'
                            ? 'Settled'
                            : 'Pending',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    'Grade ID: ${grade.id}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.neutral400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _tierLabel(String tier) {
    switch (tier) {
      case 'best':
        return 'Tier 1 — Excellent';
      case 'second':
        return 'Tier 2 — Good';
      case 'third':
        return 'Tier 3 — Satisfactory';
      default:
        return 'Below Threshold';
    }
  }

  void _showDeleteDialog(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Note',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'Are you sure you want to delete this note? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
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
            child: const Text('Delete'),
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
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.neutral400),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.neutral600,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.neutral900,
          ),
        ),
      ],
    );
  }
}
