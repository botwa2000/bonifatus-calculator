import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/term_results_provider.dart';
import '../../../../utils/term_type_utils.dart';

class TermDetailScreen extends ConsumerWidget {
  final String termId;
  const TermDetailScreen({super.key, required this.termId});

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, AppLocalizations l10n) async {
    final confirmed = await showDialog<bool>(
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
    );
    if (confirmed == true && context.mounted) {
      await ref.read(termResultsProvider.notifier).deleteTerm(termId);
      if (context.mounted) context.pop();
    }
  }

  void _showEditLabelSheet(BuildContext context, WidgetRef ref, AppLocalizations l10n, String currentLabel) {
    final ctrl = TextEditingController(text: currentLabel);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 24, right: 24, top: 24,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(l10n.termDetailEditLabel, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          TextField(
            controller: ctrl,
            decoration: InputDecoration(
              labelText: l10n.termDetailEditLabel,
              border: const OutlineInputBorder(),
            ),
            autofocus: true,
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                await ref.read(termResultsProvider.notifier).updateTermName(termId, ctrl.text.trim());
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(l10n.settingsSave, style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final termsAsync = ref.watch(termResultsProvider);

    return termsAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(l10n.termDetailTitle)),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: Text(l10n.termDetailTitle)),
        body: Center(
          child: Text(l10n.termDetailCouldNotLoad,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ),
      ),
      data: (terms) {
        final term = terms.where((t) => t.id == termId).firstOrNull;

        if (term == null) {
          return Scaffold(
            appBar: AppBar(
              title: Text(l10n.termDetailTitle),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => context.pop(),
              ),
            ),
            body: Center(
              child: Text(l10n.termDetailNotFound,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
          );
        }

        final isUnsettled = term.status != 'settled';
        final theme = Theme.of(context);
        final tier = term.tier;
        final tierColor = AppColors.tierColor(tier);
        final avg = term.averageGrade;

        return Scaffold(
          appBar: AppBar(
            title: Text(l10n.termDetailTitle),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => context.pop(),
            ),
            actions: isUnsettled
                ? [
                    IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      tooltip: l10n.termDetailEditLabel,
                      onPressed: () => _showEditLabelSheet(context, ref, l10n, term.termName ?? ''),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      tooltip: l10n.termDetailDeleteTitle,
                      onPressed: () => _confirmDelete(context, ref, l10n),
                    ),
                  ]
                : null,
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
                        Text(localizeTermLabel(l10n, term.termType, term.schoolYear, term.termName),
                            style: theme.textTheme.titleLarge),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            _Stat(
                              label: l10n.termDetailAverage,
                              value: avg != null
                                  ? avg.toStringAsFixed(1)
                                  : '-',
                              color: tierColor,
                            ),
                            const SizedBox(width: 24),
                            _Stat(
                              label: l10n.termDetailBonus,
                              value: '${term.totalBonusPoints % 1 == 0 ? term.totalBonusPoints.toInt() : term.totalBonusPoints.toStringAsFixed(1)} ${l10n.ptsAbbr}',
                              color: AppColors.success,
                            ),
                            const SizedBox(width: 24),
                            _Stat(
                              label: l10n.termDetailSubjects,
                              value: term.subjects.length.toString(),
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ],
                        ),
                        if (term.subjects.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 12),
                          Text(
                            l10n.termDetailSubjectBreakdown,
                            style: theme.textTheme.labelLarge
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                                    '+${subject.bonusPoints % 1 == 0 ? subject.bonusPoints.toInt() : subject.bonusPoints.toStringAsFixed(1)} ${l10n.ptsAbbr}',
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
                  TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: color)),
        ],
      );
}
