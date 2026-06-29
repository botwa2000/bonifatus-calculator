import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/term_results_provider.dart';

class TermDetailScreen extends ConsumerWidget {
  final String termId;
  const TermDetailScreen({super.key, required this.termId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final termsAsync = ref.watch(termResultsProvider);

    return termsAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Term Result')),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('Term Result')),
        body: const Center(
          child: Text('Could not load term',
              style: TextStyle(color: AppColors.neutral600)),
        ),
      ),
      data: (terms) {
        final term = terms.where((t) => t.id == termId).firstOrNull;

        if (term == null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Term Result'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => context.pop(),
              ),
            ),
            body: const Center(
              child: Text('Term not found',
                  style: TextStyle(color: AppColors.neutral600)),
            ),
          );
        }

        final theme = Theme.of(context);
        final tier = term.tier;
        final tierColor = AppColors.tierColor(tier);
        final avg = term.averageGrade;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Term Result'),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => context.pop(),
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(term.displayLabel,
                            style: theme.textTheme.titleLarge),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            _Stat(
                              label: 'Average',
                              value: avg != null
                                  ? avg.toStringAsFixed(1)
                                  : '-',
                              color: tierColor,
                            ),
                            const SizedBox(width: 24),
                            _Stat(
                              label: 'Bonus',
                              value: '${term.totalBonusPoints} pts',
                              color: AppColors.success,
                            ),
                            const SizedBox(width: 24),
                            _Stat(
                              label: 'Subjects',
                              value: term.subjects.length.toString(),
                              color: AppColors.neutral600,
                            ),
                          ],
                        ),
                        if (term.subjects.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 12),
                          Text(
                            'Subject Breakdown',
                            style: theme.textTheme.labelLarge
                                ?.copyWith(color: AppColors.neutral600),
                          ),
                          const SizedBox(height: 12),
                          ...term.subjects.map((subject) {
                            final grade =
                                double.tryParse(subject.gradeValue) ?? 3.0;
                            final sTier = subject.gradeQualityTier ??
                                (grade < 1.5
                                    ? 'best'
                                    : grade < 2.5
                                        ? 'second'
                                        : grade < 3.5
                                            ? 'third'
                                            : 'below');
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      subject.subjectName ??
                                          subject.subjectId,
                                      style: theme.textTheme.bodyMedium,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.tierColorLight(sTier),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      subject.gradeValue,
                                      style: TextStyle(
                                        color: AppColors.tierColor(sTier),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    '+${subject.bonusPoints} pts',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.success,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ],
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
}

class _Stat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _Stat(
      {required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 12, color: AppColors.neutral600)),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: color)),
        ],
      );
}
