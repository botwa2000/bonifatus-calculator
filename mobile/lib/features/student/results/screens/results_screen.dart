import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/term_results_provider.dart';
import '../../../../models/term_result.dart';

class ResultsScreen extends ConsumerWidget {
  const ResultsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final termsAsync = ref.watch(termResultsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            title: const Text('Saved Results'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => context.go('/student/calculator'),
              ),
            ],
          ),
          termsAsync.when(
            loading: () => const SliverFillRemaining(
              child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
            ),
            error: (err, _) => SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.error),
                      const SizedBox(height: 16),
                      const Text(
                        'Failed to load results',
                        style: TextStyle(
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
                            ref.read(termResultsProvider.notifier).reload(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                        ),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            data: (terms) {
              if (terms.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(Icons.assignment_outlined,
                                color: AppColors.primary, size: 36),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No saved results yet',
                            style:
                                theme.textTheme.titleMedium?.copyWith(
                              color: AppColors.neutral900,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Use the calculator to save your first term result.',
                            style:
                                theme.textTheme.bodyMedium?.copyWith(
                              color: AppColors.neutral600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () => context.go('/student/calculator'),
                            icon: const Icon(Icons.calculate_rounded),
                            label: const Text('Open Calculator'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: AppColors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      final term = terms[i];
                      return _TermCard(term: term);
                    },
                    childCount: terms.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TermCard extends StatelessWidget {
  final TermResult term;

  const _TermCard({required this.term});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tier = term.tier;
    final color = AppColors.tierColor(tier);
    final lightColor = AppColors.tierColorLight(tier);
    final avgGrade = term.averageGrade;
    final avgStr = avgGrade != null
        ? avgGrade.toStringAsFixed(1)
        : '-';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/student/results/${term.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                    color: lightColor,
                    borderRadius: BorderRadius.circular(8)),
                child: Text(
                  avgStr,
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w700,
                      fontSize: 18),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(term.displayLabel,
                        style: theme.textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(
                      '${term.totalBonusPoints} pts · ${term.subjects.length} subjects',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: term.totalBonusPoints >= 0
                            ? AppColors.success
                            : AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.neutral400),
            ],
          ),
        ),
      ),
    );
  }
}
