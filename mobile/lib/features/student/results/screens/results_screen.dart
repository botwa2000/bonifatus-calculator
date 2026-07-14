import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/term_results_provider.dart';
import '../../../../models/term_result.dart';
import '../../../../utils/term_type_utils.dart';

class ResultsScreen extends ConsumerWidget {
  const ResultsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final termsAsync = ref.watch(termResultsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            title: Text(l10n.resultsTitle),
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
                      Text(
                        l10n.resultsFailedToLoad,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        err.toString(),
                        style: TextStyle(
                            fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                        child: Text(l10n.resultsRetry),
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
                            l10n.resultsNoResults,
                            style:
                                theme.textTheme.titleMedium?.copyWith(
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l10n.resultsUseCalculator,
                            style:
                                theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () => context.go('/student/calculator'),
                            icon: const Icon(Icons.calculate_rounded),
                            label: Text(l10n.resultsOpenCalculator),
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
                      if (term.status == 'settled') {
                        return _TermCard(term: term);
                      }
                      return Dismissible(
                        key: ValueKey(term.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 24),
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.delete_outline, color: Colors.white, size: 26),
                        ),
                        confirmDismiss: (_) async {
                          return await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: Text(l10n.termDetailDeleteTitle),
                              content: Text(l10n.termDetailDeleteConfirm),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(ctx).pop(false),
                                  child: Text(l10n.settingsCancel),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.of(ctx).pop(true),
                                  style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                  child: Text(l10n.termDetailDelete),
                                ),
                              ],
                            ),
                          ) ?? false;
                        },
                        onDismissed: (_) {
                          ref.read(termResultsProvider.notifier).deleteTerm(term.id);
                        },
                        child: _TermCard(term: term),
                      );
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
    final l10n = AppLocalizations.of(context)!;
    final tier = term.tier;
    final color = AppColors.tierColor(tier);
    final lightColor = AppColors.tierColorLight(tier);
    final primary = term.averagePrimary;
    final secondary = term.averageSecondary;
    final settled = term.settlementStatus == 'settled';
    final pts = term.totalBonusPoints;
    final ptsStr = pts % 1 == 0 ? pts.toInt().toString() : pts.toStringAsFixed(1);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/student/results/${term.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Leading: average grade box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: lightColor, borderRadius: BorderRadius.circular(8)),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(primary, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 18)),
                    if (secondary != null)
                      Text(secondary, style: TextStyle(color: color.withValues(alpha: 0.75), fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(localizeTermLabel(l10n, term.termType, term.schoolYear, term.termName),
                        style: theme.textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(
                      '$ptsStr ${l10n.ptsAbbr} · ${l10n.calculatorSubjectsLabel(term.subjects.length)}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: pts >= 0 ? AppColors.success : AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
              // Settlement badge
              if (settled) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.tierBestLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(l10n.termSettledBadge,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.tierBest)),
                ),
              ],
              const SizedBox(width: 4),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
