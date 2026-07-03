import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../models/calculator_config.dart';
import '../../providers/calculator_config_provider.dart';
import '../../providers/term_results_provider.dart';

class CalculatorScreen extends ConsumerStatefulWidget {
  const CalculatorScreen({super.key});

  @override
  ConsumerState<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends ConsumerState<CalculatorScreen> {
  final List<_SubjectEntry> _subjects = [];
  bool _saving = false;

  // Term metadata
  String _termType = 'S1';
  String _schoolYear = _defaultSchoolYear();

  static String _defaultSchoolYear() {
    final now = DateTime.now();
    final year = now.month >= 8 ? now.year : now.year - 1;
    return '$year/${(year + 1).toString().substring(2)}';
  }

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
    if (grade == grade.truncateToDouble()) return grade.toInt().toString();
    return grade.toStringAsFixed(1);
  }

  void _showAddSubjectSheet(CalculatorConfig config) {
    final searchCtrl = TextEditingController();
    final gradeCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    SubjectItem? pickedSubject;
    String searchQuery = '';

    // Sort: core subjects first, then alphabetical
    final allSubjects = [...config.subjects]..sort((a, b) {
        if (a.isCoreSubject != b.isCoreSubject) return a.isCoreSubject ? -1 : 1;
        return a.name.compareTo(b.name);
      });

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return StatefulBuilder(builder: (ctx, setSheetState) {
          final filtered = searchQuery.isEmpty
              ? allSubjects
              : allSubjects.where((s) => s.name.toLowerCase().contains(searchQuery.toLowerCase())).toList();

          final coreSubjects = filtered.where((s) => s.isCoreSubject).toList();
          final otherSubjects = filtered.where((s) => !s.isCoreSubject).toList();

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
                  const SizedBox(height: 16),

                  // Search field
                  TextField(
                    controller: searchCtrl,
                    autofocus: config.subjects.length > 6,
                    decoration: InputDecoration(
                      hintText: 'Search subjects…',
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.neutral400),
                      suffixIcon: searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                setSheetState(() { searchQuery = ''; pickedSubject = null; });
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppColors.neutral50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onChanged: (v) => setSheetState(() { searchQuery = v; pickedSubject = null; }),
                  ),
                  const SizedBox(height: 12),

                  // Subject list — scrollable, max ~240px
                  if (config.subjects.isNotEmpty)
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 240),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (coreSubjects.isNotEmpty) ...[
                              if (otherSubjects.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Text('Core Subjects',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                                        color: AppColors.neutral400, letterSpacing: 0.5)),
                                ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: coreSubjects.map((s) => _SubjectChip(
                                  subject: s,
                                  selected: pickedSubject?.id == s.id,
                                  onTap: () => setSheetState(() => pickedSubject = s),
                                )).toList(),
                              ),
                            ],
                            if (otherSubjects.isNotEmpty) ...[
                              if (coreSubjects.isNotEmpty) const SizedBox(height: 12),
                              if (coreSubjects.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Text('Other Subjects',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                                        color: AppColors.neutral400, letterSpacing: 0.5)),
                                ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: otherSubjects.map((s) => _SubjectChip(
                                  subject: s,
                                  selected: pickedSubject?.id == s.id,
                                  onTap: () => setSheetState(() => pickedSubject = s),
                                )).toList(),
                              ),
                            ],
                            if (filtered.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Text('No subjects match "$searchQuery"',
                                    style: const TextStyle(color: AppColors.neutral400, fontSize: 13)),
                              ),
                          ],
                        ),
                      ),
                    ),

                  if (pickedSubject != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 16),
                          const SizedBox(width: 8),
                          Text(pickedSubject!.name,
                              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14)),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 14),
                  FormField<SubjectItem>(
                    validator: (_) => pickedSubject == null ? 'Please select a subject' : null,
                    builder: (state) => state.hasError
                        ? Text(state.errorText!, style: const TextStyle(color: AppColors.error, fontSize: 12))
                        : const SizedBox.shrink(),
                  ),

                  TextFormField(
                    controller: gradeCtrl,
                    decoration: InputDecoration(
                      labelText: 'Grade (${config.defaultGradingSystem.minGrade.toInt()} – ${config.defaultGradingSystem.maxGrade.toInt()})',
                      hintText: 'e.g. 2',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Please enter a grade';
                      final parsed = double.tryParse(v.trim());
                      final min = config.defaultGradingSystem.minGrade;
                      final max = config.defaultGradingSystem.maxGrade;
                      if (parsed == null || parsed < min || parsed > max) {
                        return 'Grade must be between ${min.toInt()} and ${max.toInt()}';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState!.validate() && pickedSubject != null) {
                          setState(() {
                            _subjects.add(_SubjectEntry(
                              subjectId: pickedSubject!.id,
                              subject: pickedSubject!.name,
                              grade: double.parse(gradeCtrl.text.trim()),
                            ));
                          });
                          Navigator.of(sheetCtx).pop();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Add Subject', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  Future<void> _saveResult(CalculatorConfig config) async {
    if (_subjects.isEmpty) return;
    setState(() => _saving = true);

    try {
      final subjects = _subjects
          .map((e) => <String, dynamic>{'subjectId': e.subjectId, 'grade': _formatGrade(e.grade)})
          .toList();

      await ref.read(termResultsProvider.notifier).saveTerm(
            gradingSystemId: config.defaultGradingSystem.id,
            classLevel: 1,
            termType: _termType,
            schoolYear: _schoolYear,
            subjects: subjects,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Result saved!'),
            backgroundColor: AppColors.tierBest,
          ),
        );
        context.go('/student/results');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(calculatorConfigProvider);

    return configAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Grade Calculator')),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => _buildScaffold(CalculatorConfig.fallback),
      data: (config) => _buildScaffold(config),
    );
  }

  Widget _buildScaffold(CalculatorConfig config) {
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
                ? _buildSubjectList(context, config)
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
          // Term metadata row
          if (hasSubjects)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      // ignore: deprecated_member_use
                      value: _termType,
                      decoration: InputDecoration(
                        labelText: 'Term',
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                        isDense: true,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'S1', child: Text('Semester 1')),
                        DropdownMenuItem(value: 'S2', child: Text('Semester 2')),
                      ],
                      onChanged: (v) =>
                          setState(() => _termType = v ?? _termType),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      initialValue: _schoolYear,
                      decoration: InputDecoration(
                        labelText: 'School Year',
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                        isDense: true,
                      ),
                      onChanged: (v) =>
                          setState(() => _schoolYear = v),
                    ),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: OutlinedButton.icon(
              onPressed: () => _showAddSubjectSheet(config),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Subject'),
            ),
          ),
          if (hasSubjects)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: ElevatedButton(
                onPressed: _saving ? null : () => _saveResult(config),
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Save Result'),
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

  Widget _buildSubjectList(BuildContext context, CalculatorConfig config) {
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
                    color: AppColors.neutral200, width: 24, thickness: 1),
                Expanded(
                  child: _ResultStat(
                    label: 'Average',
                    value: _formatGrade(average),
                    valueColor: tierColor,
                  ),
                ),
                VerticalDivider(
                    color: AppColors.neutral200, width: 24, thickness: 1),
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
  final String subjectId;
  final String subject;
  final double grade;

  const _SubjectEntry({
    required this.subjectId,
    required this.subject,
    required this.grade,
  });
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

class _SubjectChip extends StatelessWidget {
  final SubjectItem subject;
  final bool selected;
  final VoidCallback onTap;

  const _SubjectChip({required this.subject, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.neutral100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.neutral200,
            width: 1.5,
          ),
        ),
        child: Text(
          subject.name,
          style: TextStyle(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? AppColors.white : AppColors.neutral700,
          ),
        ),
      ),
    );
  }
}
