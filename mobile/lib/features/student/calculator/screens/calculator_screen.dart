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
  bool _settingsExpanded = true;

  String? _selectedSystemId;
  int _classLevel = 7;
  String _termType = 'semester_2';
  String _schoolYear = _defaultSchoolYear();
  String _termName = '';

  static String _defaultSchoolYear() {
    final now = DateTime.now();
    final year = now.month >= 8 ? now.year : now.year - 1;
    return '$year/${(year + 1).toString().substring(2)}';
  }

  String _tierDisplayLabel(String tier) {
    switch (tier) {
      case 'best':
        return 'Excellent';
      case 'second':
        return 'Good';
      case 'third':
        return 'Satisfactory';
      default:
        return 'Below threshold';
    }
  }

  GradingSystem _resolveSystem(CalculatorConfig config) {
    if (_selectedSystemId != null) {
      return config.gradingSystems
              .where((s) => s.id == _selectedSystemId)
              .firstOrNull ??
          config.defaultGradingSystem;
    }
    return config.defaultGradingSystem;
  }

  _CalcResult _calculate(CalculatorConfig config) {
    final system = _resolveSystem(config);
    if (_subjects.isEmpty) {
      return const _CalcResult(total: 0, breakdown: []);
    }
    double rawTotal = 0;
    final breakdown = <_BreakdownItem>[];
    for (final entry in _subjects) {
      final result = config.calculateSubjectBonus(
        system,
        _classLevel,
        _termType,
        entry.grade,
        entry.weight,
      );
      rawTotal += result.bonus;
      breakdown.add(_BreakdownItem(
        subject: entry.subject,
        grade: entry.grade,
        tier: result.tier,
        bonus: result.bonus,
        weight: entry.weight,
      ));
    }
    final total = rawTotal < 0 ? 0.0 : rawTotal;
    return _CalcResult(total: total, breakdown: breakdown);
  }

  void _showAddSubjectSheet(CalculatorConfig config) {
    final system = _resolveSystem(config);
    final searchCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    SubjectItem? pickedSubject;
    String pickedGrade = '';
    double pickedWeight = 1.0;
    String searchQuery = '';

    final allSubjects = [...config.subjects]..sort((a, b) {
        if (a.isCoreSubject != b.isCoreSubject) return a.isCoreSubject ? -1 : 1;
        return a.name.compareTo(b.name);
      });

    final alreadyAdded = _subjects.map((s) => s.subjectId).toSet();
    final availableSubjects =
        allSubjects.where((s) => !alreadyAdded.contains(s.id)).toList();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          final filtered = searchQuery.isEmpty
              ? availableSubjects
              : availableSubjects
                  .where((s) => s.name
                      .toLowerCase()
                      .contains(searchQuery.toLowerCase()))
                  .toList();

          // Group by category if categories are available, else fall back to core/other
          final categoriesAvailable = config.categories.isNotEmpty &&
              filtered.any((s) => s.categoryId != null);
          final Map<String, List<SubjectItem>> groupedSubjects;
          if (categoriesAvailable) {
            final catMap = {for (final c in config.categories) c.id: c};
            groupedSubjects = {};
            for (final s in filtered) {
              final catName = s.categoryId != null && catMap.containsKey(s.categoryId)
                  ? catMap[s.categoryId]!.name
                  : 'Other';
              (groupedSubjects[catName] ??= []).add(s);
            }
          } else {
            final core = filtered.where((s) => s.isCoreSubject).toList();
            final other = filtered.where((s) => !s.isCoreSubject).toList();
            groupedSubjects = {
              if (core.isNotEmpty) 'Core Subjects': core,
              if (other.isNotEmpty) 'Other': other,
            };
          }

          final gradeValues = system.gradeValues;
          final useGradeChips = gradeValues.isNotEmpty && gradeValues.length <= 10;

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 24,
              bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 24,
            ),
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
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
                    const Text(
                      'Add Subject',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.neutral900,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Subject search
                    TextField(
                      controller: searchCtrl,
                      autofocus: false,
                      decoration: InputDecoration(
                        hintText: 'Search subjects…',
                        prefixIcon: const Icon(Icons.search_rounded,
                            color: AppColors.neutral400),
                        suffixIcon: searchQuery.isNotEmpty
                            ? IconButton(
                                icon:
                                    const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  searchCtrl.clear();
                                  setSheet(() {
                                    searchQuery = '';
                                    pickedSubject = null;
                                  });
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppColors.neutral50,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none),
                      ),
                      onChanged: (v) => setSheet(() {
                        searchQuery = v;
                        pickedSubject = null;
                      }),
                    ),
                    const SizedBox(height: 12),

                    // Subject chips
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 220),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (final entry in groupedSubjects.entries) ...[
                              if (groupedSubjects.length > 1)
                                Padding(
                                  padding: EdgeInsets.only(
                                      top: groupedSubjects.keys.first == entry.key ? 0 : 12,
                                      bottom: 6),
                                  child: Text(entry.key,
                                      style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.neutral400,
                                          letterSpacing: 0.5)),
                                ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: entry.value
                                    .map((s) => _SubjectChip(
                                          subject: s,
                                          selected: pickedSubject?.id == s.id,
                                          onTap: () => setSheet(
                                              () => pickedSubject = s),
                                        ))
                                    .toList(),
                              ),
                            ],
                            if (filtered.isEmpty && config.subjects.isNotEmpty)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                child: Text(
                                  'No subjects match "$searchQuery"',
                                  style: const TextStyle(
                                      color: AppColors.neutral400,
                                      fontSize: 13),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),

                    if (pickedSubject != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded,
                                color: AppColors.primary, size: 16),
                            const SizedBox(width: 8),
                            Text(pickedSubject!.name,
                                style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14)),
                          ],
                        ),
                      ),
                    ],

                    // Subject validator
                    FormField<SubjectItem>(
                      validator: (_) => pickedSubject == null
                          ? 'Please select a subject'
                          : null,
                      builder: (state) => state.hasError
                          ? Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(state.errorText!,
                                  style: const TextStyle(
                                      color: AppColors.error, fontSize: 12)),
                            )
                          : const SizedBox.shrink(),
                    ),

                    const SizedBox(height: 16),

                    // Grade picker
                    const Text(
                      'Grade',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.neutral700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (useGradeChips)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: gradeValues.map((g) {
                          final selected = pickedGrade == g;
                          final tier = system.deriveTier(g);
                          final tierColor = selected
                              ? AppColors.tierColor(tier)
                              : AppColors.neutral400;
                          final tierBg = selected
                              ? AppColors.tierColorLight(tier)
                              : AppColors.neutral100;
                          return GestureDetector(
                            onTap: () => setSheet(() => pickedGrade = g),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 120),
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: tierBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selected
                                      ? tierColor
                                      : AppColors.neutral200,
                                  width: selected ? 2 : 1,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                g,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: tierColor,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      )
                    else
                      TextFormField(
                        decoration: InputDecoration(
                          hintText: 'e.g. ${system.minGrade.toInt()}',
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))
                        ],
                        onChanged: (v) => setSheet(() => pickedGrade = v),
                      ),

                    // Grade validator
                    FormField<String>(
                      validator: (_) => pickedGrade.trim().isEmpty
                          ? 'Please select a grade'
                          : null,
                      builder: (state) => state.hasError
                          ? Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(state.errorText!,
                                  style: const TextStyle(
                                      color: AppColors.error, fontSize: 12)),
                            )
                          : const SizedBox.shrink(),
                    ),

                    const SizedBox(height: 16),

                    // Weight (only show if subject was picked)
                    if (pickedSubject != null) ...[
                      Row(
                        children: [
                          const Text(
                            'Weight',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.neutral700,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Tooltip(
                            message:
                                'Higher weight = more bonus. Use 2× for harder exams.',
                            child: Icon(Icons.info_outline_rounded,
                                size: 16, color: AppColors.neutral400),
                          ),
                          const Spacer(),
                          _WeightStepper(
                            value: pickedWeight,
                            onChanged: (v) => setSheet(() => pickedWeight = v),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          if (formKey.currentState!.validate() &&
                              pickedSubject != null &&
                              pickedGrade.trim().isNotEmpty) {
                            setState(() {
                              _subjects.add(_SubjectEntry(
                                subjectId: pickedSubject!.id,
                                subject: pickedSubject!.name,
                                grade: pickedGrade.trim(),
                                weight: pickedWeight,
                              ));
                            });
                            Navigator.of(sheetCtx).pop();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Add Subject',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
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
      final system = _resolveSystem(config);
      final subjects = _subjects
          .map((e) => <String, dynamic>{
                'subjectId': e.subjectId,
                'grade': e.grade,
                'weight': e.weight,
              })
          .toList();

      await ref.read(termResultsProvider.notifier).saveTerm(
            gradingSystemId: system.id,
            classLevel: _classLevel,
            termType: _termType,
            schoolYear: _schoolYear,
            termName: _termName.isNotEmpty ? _termName : null,
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
        backgroundColor: AppColors.neutral50,
        appBar: AppBar(title: const Text('Grade Calculator')),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => _buildBody(CalculatorConfig.fallback),
      data: (config) {
        // Auto-select first grading system on first load
        if (_selectedSystemId == null && config.gradingSystems.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() =>
                  _selectedSystemId = config.gradingSystems.first.id);
            }
          });
        }
        return _buildBody(config);
      },
    );
  }

  Widget _buildBody(CalculatorConfig config) {
    final calcResult = _calculate(config);
    final hasSubjects = _subjects.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'Grade Calculator',
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: AnimatedRotation(
              turns: _settingsExpanded ? 0.5 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: const Icon(Icons.tune_rounded,
                  color: AppColors.neutral700),
            ),
            tooltip: 'Settings',
            onPressed: () =>
                setState(() => _settingsExpanded = !_settingsExpanded),
          ),
        ],
      ),
      body: Column(
        children: [
          // Settings panel
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: _settingsExpanded
                ? _buildSettingsPanel(config)
                : const SizedBox.shrink(),
          ),

          // Subject list / empty state
          Expanded(
            child: hasSubjects
                ? _buildSubjectList(config, calcResult)
                : _buildEmptyState(),
          ),

          // Add subject button
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: OutlinedButton.icon(
              onPressed: () => _showAddSubjectSheet(config),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Subject'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ),

          // Results card (only when subjects present)
          if (hasSubjects) _buildResultCard(calcResult, config),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildSettingsPanel(CalculatorConfig config) {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(height: 1, color: AppColors.neutral100),
          const SizedBox(height: 14),

          // Grading system (only if multiple)
          if (config.gradingSystems.length > 1) ...[
            const Text(
              'Grading System',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.neutral600),
            ),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _selectedSystemId ?? config.defaultGradingSystem.id,
              decoration: InputDecoration(
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.neutral200)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.neutral200)),
              ),
              items: config.gradingSystems
                  .map((s) => DropdownMenuItem(
                        value: s.id,
                        child: Text(s.name,
                            style: const TextStyle(fontSize: 14)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _selectedSystemId = v),
            ),
            const SizedBox(height: 12),
          ],

          // Class level + Term type in a row
          Row(
            children: [
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Class',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral600)),
                    const SizedBox(height: 6),
                    _ClassLevelStepper(
                      value: _classLevel,
                      onChanged: (v) => setState(() => _classLevel = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Term',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral600)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _termType,
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.neutral200)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.neutral200)),
                      ),
                      items: config.effectiveTermTypes
                          .map((t) => DropdownMenuItem(
                                value: t.code,
                                child: Text(t.name,
                                    style: const TextStyle(fontSize: 14)),
                              ))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _termType = v ?? _termType),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // School year + term name
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('School Year',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral600)),
                    const SizedBox(height: 6),
                    TextFormField(
                      initialValue: _schoolYear,
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.neutral200)),
                        hintText: '2024/25',
                      ),
                      style: const TextStyle(fontSize: 14),
                      onChanged: (v) => _schoolYear = v,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Label (optional)',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral600)),
                    const SizedBox(height: 6),
                    TextFormField(
                      initialValue: _termName,
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.neutral200)),
                        hintText: 'e.g. Final exam',
                      ),
                      style: const TextStyle(fontSize: 14),
                      onChanged: (v) => _termName = v,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Icon(Icons.calculate_rounded,
                  color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 20),
            const Text(
              'Grade Planner',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Set your class and term above, then tap "Add Subject" to enter grades and see your bonus.',
              style: TextStyle(fontSize: 14, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectList(CalculatorConfig config, _CalcResult result) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      itemCount: _subjects.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final entry = _subjects[index];
        final item = result.breakdown.elementAtOrNull(index);
        final tier = item?.tier ?? 'below';
        final bonus = item?.bonus ?? 0.0;
        final tierColor = AppColors.tierColor(tier);
        final tierBg = AppColors.tierColorLight(tier);

        return InkWell(
          onTap: () => _showEditSubjectSheet(config, index),
          borderRadius: BorderRadius.circular(14),
          child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.neutral100),
          ),
          child: Row(
            children: [
              // Grade badge
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: tierBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Text(
                  entry.grade,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: tierColor,
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Subject + tier
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.subject,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.neutral900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: tierBg,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _tierDisplayLabel(tier),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: tierColor,
                            ),
                          ),
                        ),
                        if (entry.weight != 1.0) ...[
                          const SizedBox(width: 6),
                          Text(
                            '×${entry.weight % 1 == 0 ? entry.weight.toInt() : entry.weight}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.neutral400,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Bonus
              Text(
                '+${bonus.toStringAsFixed(1)} pts',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.tierBest,
                ),
              ),
              const SizedBox(width: 4),

              // Delete
              GestureDetector(
                onTap: () => setState(() => _subjects.removeAt(index)),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  child: const Icon(Icons.close_rounded,
                      size: 16, color: AppColors.neutral400),
                ),
              ),
            ],
          ),
          ),
        );
      },
    );
  }

  void _showEditSubjectSheet(CalculatorConfig config, int index) {
    final existing = _subjects[index];
    final system = _resolveSystem(config);
    String pickedGrade = existing.grade;
    double pickedWeight = existing.weight;

    final gradeValues = system.gradeValues;
    final useGradeChips = gradeValues.isNotEmpty && gradeValues.length <= 10;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) => StatefulBuilder(builder: (ctx, setSheet) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 24,
            bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 24,
          ),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: AppColors.neutral200, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: Text(existing.subject,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.neutral900))),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                onPressed: () { setState(() => _subjects.removeAt(index)); Navigator.of(sheetCtx).pop(); },
                tooltip: 'Remove',
              ),
            ]),
            const SizedBox(height: 16),
            const Text('Grade', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
            const SizedBox(height: 8),
            if (useGradeChips)
              Wrap(spacing: 8, runSpacing: 8, children: gradeValues.map((g) {
                final selected = pickedGrade == g;
                final tier = system.deriveTier(g);
                final tc = selected ? AppColors.tierColor(tier) : AppColors.neutral400;
                final tb = selected ? AppColors.tierColorLight(tier) : AppColors.neutral100;
                return GestureDetector(
                  onTap: () => setSheet(() => pickedGrade = g),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: tb, borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: selected ? tc : AppColors.neutral200, width: selected ? 2 : 1)),
                    alignment: Alignment.center,
                    child: Text(g, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: tc)),
                  ),
                );
              }).toList())
            else
              TextFormField(
                initialValue: existing.grade,
                decoration: InputDecoration(isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (v) => setSheet(() => pickedGrade = v),
              ),
            const SizedBox(height: 16),
            Row(children: [
              const Text('Weight', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
              const Spacer(),
              _WeightStepper(value: pickedWeight, onChanged: (v) => setSheet(() => pickedWeight = v)),
            ]),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: pickedGrade.trim().isEmpty ? null : () {
                  setState(() => _subjects[index] = _SubjectEntry(
                    subjectId: existing.subjectId,
                    subject: existing.subject,
                    grade: pickedGrade.trim(),
                    weight: pickedWeight,
                  ));
                  Navigator.of(sheetCtx).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary, foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        );
      }),
    );
  }

  Widget _buildResultCard(_CalcResult result, CalculatorConfig config) {
    final total = result.total;
    final hasData = result.breakdown.isNotEmpty;

    // Dominant tier (most subjects in this tier)
    String dominantTier = 'below';
    if (hasData) {
      final tierCounts = <String, int>{};
      for (final b in result.breakdown) {
        tierCounts[b.tier] = (tierCounts[b.tier] ?? 0) + 1;
      }
      dominantTier = tierCounts.entries
          .reduce((a, b) => a.value >= b.value ? a : b)
          .key;
    }
    final cardColor = AppColors.tierColor(dominantTier);
    final cardBg = AppColors.tierColorLight(dominantTier);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardColor.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Bonus',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.neutral600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${total.toStringAsFixed(1)} pts',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: cardColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_subjects.length} subject${_subjects.length == 1 ? '' : 's'}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cardColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : () => _saveResult(config),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Save Result',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Data classes ──────────────────────────────────────────────────────────────

class _SubjectEntry {
  final String subjectId;
  final String subject;
  final String grade;
  final double weight;

  const _SubjectEntry({
    required this.subjectId,
    required this.subject,
    required this.grade,
    this.weight = 1.0,
  });
}

class _BreakdownItem {
  final String subject;
  final String grade;
  final String tier;
  final double bonus;
  final double weight;

  const _BreakdownItem({
    required this.subject,
    required this.grade,
    required this.tier,
    required this.bonus,
    required this.weight,
  });
}

class _CalcResult {
  final double total;
  final List<_BreakdownItem> breakdown;

  const _CalcResult({required this.total, required this.breakdown});
}

// ── Widgets ───────────────────────────────────────────────────────────────────

class _SubjectChip extends StatelessWidget {
  final SubjectItem subject;
  final bool selected;
  final VoidCallback onTap;

  const _SubjectChip(
      {required this.subject, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
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

class _ClassLevelStepper extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;

  const _ClassLevelStepper(
      {required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.neutral200),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            onPressed: value > 1 ? () => onChanged(value - 1) : null,
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 36),
            alignment: Alignment.center,
            child: Text(
              value.toString(),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
          ),
          _StepButton(
            icon: Icons.add_rounded,
            onPressed: value < 13 ? () => onChanged(value + 1) : null,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;

  const _StepButton({required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Icon(
          icon,
          size: 18,
          color: onPressed == null
              ? AppColors.neutral400
              : AppColors.neutral700,
        ),
      ),
    );
  }
}

class _WeightStepper extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const _WeightStepper(
      {required this.value, required this.onChanged});

  static const _steps = [0.5, 1.0, 1.5, 2.0, 3.0];

  @override
  Widget build(BuildContext context) {
    final idx = _steps.indexOf(value);
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.neutral200),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            onPressed: idx > 0 ? () => onChanged(_steps[idx - 1]) : null,
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 36),
            alignment: Alignment.center,
            child: Text(
              '×${value % 1 == 0 ? value.toInt() : value}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
          ),
          _StepButton(
            icon: Icons.add_rounded,
            onPressed: idx < _steps.length - 1
                ? () => onChanged(_steps[idx + 1])
                : null,
          ),
        ],
      ),
    );
  }
}
