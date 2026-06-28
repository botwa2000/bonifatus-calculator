import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';

class CalculatorScreen extends StatefulWidget {
  const CalculatorScreen({super.key});

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  final List<_SubjectEntry> _subjects = [];

  String _tierForAverage(double avg) {
    if (avg < 1.5) return 'best';
    if (avg < 2.5) return 'second';
    if (avg < 3.5) return 'third';
    return 'below';
  }

  String _tierDisplayLabel(String tier) {
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

  int _bonusPoints(String tier) {
    switch (tier) {
      case 'best':
        return 20;
      case 'second':
        return 12;
      case 'third':
        return 8;
      default:
        return 0;
    }
  }

  String _formatGrade(double grade) {
    if (grade == grade.truncateToDouble()) {
      return grade.toInt().toString();
    }
    return grade.toStringAsFixed(1);
  }

  void _showAddSubjectSheet() {
    final subjectCtrl = TextEditingController();
    final gradeCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 24,
          ),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.neutral200,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Add Subject',
                  style: Theme.of(sheetCtx).textTheme.titleLarge?.copyWith(
                        color: AppColors.neutral900,
                      ),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: subjectCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Subject name',
                    hintText: 'e.g. Mathematics',
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Please enter a subject name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: gradeCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Grade (1 to 6)',
                    hintText: 'e.g. 2',
                  ),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                  ],
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Please enter a grade';
                    }
                    final parsed = double.tryParse(v.trim());
                    if (parsed == null || parsed < 1 || parsed > 6) {
                      return 'Grade must be between 1 and 6';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    if (formKey.currentState!.validate()) {
                      setState(() {
                        _subjects.add(
                          _SubjectEntry(
                            subject: subjectCtrl.text.trim(),
                            grade: double.parse(gradeCtrl.text.trim()),
                          ),
                        );
                      });
                      Navigator.of(sheetCtx).pop();
                    }
                  },
                  child: const Text('Add'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasSubjects = _subjects.isNotEmpty;
    final average = hasSubjects
        ? _subjects.fold(0.0, (sum, e) => sum + e.grade) / _subjects.length
        : 0.0;
    final tier = hasSubjects ? _tierForAverage(average) : 'below';
    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Grade Calculator'),
        centerTitle: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: hasSubjects
                ? _buildSubjectList(context)
                : _buildEmptyState(context),
          ),
          if (hasSubjects)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: _buildResultCard(
                context,
                average: average,
                tier: tier,
                tierColor: tierColor,
                tierColorLight: tierColorLight,
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: OutlinedButton.icon(
              onPressed: _showAddSubjectSheet,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Subject'),
            ),
          ),
          if (hasSubjects)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Saved!')),
                  );
                },
                child: const Text('Save Result'),
              ),
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
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
              child: const Icon(
                Icons.calculate_rounded,
                color: AppColors.primary,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No subjects yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.neutral900,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Add Subject" to start calculating your average and bonus points.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.neutral600,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectList(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      itemCount: _subjects.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final entry = _subjects[index];
        final entryTier = _tierForAverage(entry.grade);
        final color = AppColors.tierColor(entryTier);
        final lightColor = AppColors.tierColorLight(entryTier);

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.neutral200),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: lightColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    _formatGrade(entry.grade),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  entry.subject,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.neutral900,
                      ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 20),
                color: AppColors.neutral400,
                tooltip: 'Remove',
                onPressed: () {
                  setState(() => _subjects.removeAt(index));
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildResultCard(
    BuildContext context, {
    required double average,
    required String tier,
    required Color tierColor,
    required Color tierColorLight,
  }) {
    final bonus = _bonusPoints(tier);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: tierColor, width: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          IntrinsicHeight(
            child: Row(
              children: [
                Expanded(
                  child: _ResultStat(
                    label: 'Subjects',
                    value: _subjects.length.toString(),
                  ),
                ),
                VerticalDivider(
                  color: AppColors.neutral200,
                  width: 24,
                  thickness: 1,
                ),
                Expanded(
                  child: _ResultStat(
                    label: 'Average',
                    value: _formatGrade(average),
                    valueColor: tierColor,
                  ),
                ),
                VerticalDivider(
                  color: AppColors.neutral200,
                  width: 24,
                  thickness: 1,
                ),
                Expanded(
                  child: _ResultStat(
                    label: 'Bonus',
                    value: '+$bonus pts',
                    valueColor: tierColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: tierColorLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _tierDisplayLabel(tier),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: tierColor,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SubjectEntry {
  final String subject;
  final double grade;

  const _SubjectEntry({required this.subject, required this.grade});
}

class _ResultStat extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _ResultStat({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: valueColor ?? AppColors.neutral900,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
      ],
    );
  }
}
