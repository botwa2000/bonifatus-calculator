import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../models/calculator_config.dart';
import '../../providers/calculator_config_provider.dart';
import '../../providers/term_results_provider.dart';
import '../../../../utils/term_type_utils.dart';

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

  String _tierDisplayLabel(String tier, AppLocalizations l10n) {
    switch (tier) {
      case 'best':
        return l10n.calculatorTierExcellent;
      case 'second':
        return l10n.calculatorTierGood;
      case 'third':
        return l10n.calculatorTierSatisfactory;
      default:
        return l10n.calculatorTierBelow;
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
    final l10n = AppLocalizations.of(context)!;
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
                  : l10n.calculatorOther;
              (groupedSubjects[catName] ??= []).add(s);
            }
          } else {
            final core = filtered.where((s) => s.isCoreSubject).toList();
            final other = filtered.where((s) => !s.isCoreSubject).toList();
            groupedSubjects = {
              if (core.isNotEmpty) l10n.calculatorCoreSubjects: core,
              if (other.isNotEmpty) l10n.calculatorOther: other,
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
                          color: Theme.of(ctx).colorScheme.outlineVariant,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      l10n.calculatorAddSubject,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(ctx).colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      controller: searchCtrl,
                      autofocus: false,
                      decoration: InputDecoration(
                        hintText: l10n.calculatorSearchSubjects,
                        prefixIcon: Icon(Icons.search_rounded,
                            color: Theme.of(ctx).colorScheme.onSurfaceVariant),
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
                        fillColor: Theme.of(ctx).colorScheme.surfaceContainerHighest,
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
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Theme.of(ctx).colorScheme.onSurfaceVariant,
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
                                  l10n.calculatorNoSubjectsMatch(searchQuery),
                                  style: TextStyle(
                                      color: Theme.of(ctx).colorScheme.onSurfaceVariant,
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
                            Text(pickedSubject!.name.isEmpty ? l10n.nameUnknown : pickedSubject!.name,
                                style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14)),
                          ],
                        ),
                      ),
                    ],

                    FormField<SubjectItem>(
                      validator: (_) => pickedSubject == null
                          ? l10n.calculatorSelectSubjectValidator
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

                    Text(
                      l10n.calculatorGradeLabel,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(ctx).colorScheme.onSurface,
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
                              : Theme.of(ctx).colorScheme.onSurfaceVariant;
                          final tierBg = selected
                              ? AppColors.tierColorLight(tier)
                              : Theme.of(ctx).colorScheme.surfaceContainerHighest;
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
                                      : Theme.of(ctx).colorScheme.outlineVariant,
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
                          hintText: l10n.calculatorGradeHint(system.minGrade.toInt().toString()),
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

                    FormField<String>(
                      validator: (_) => pickedGrade.trim().isEmpty
                          ? l10n.calculatorSelectGradeValidator
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

                    if (pickedSubject != null) ...[
                      Row(
                        children: [
                          Text(
                            l10n.calculatorWeightLabel,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(ctx).colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Tooltip(
                            message: l10n.calculatorWeightTooltip,
                            child: Icon(Icons.info_outline_rounded,
                                size: 16, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
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
                                subject: pickedSubject!.name.isEmpty ? l10n.nameUnknown : pickedSubject!.name,
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
                        child: Text(l10n.calculatorAddSubject,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
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
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.calculatorResultSaved),
            backgroundColor: AppColors.tierBest,
          ),
        );
        context.go('/student/results');
      }
    } catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.calculatorFailedToSave(e.toString())),
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
    final l10n = AppLocalizations.of(context)!;
    final configAsync = ref.watch(calculatorConfigProvider);

    return configAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(l10n.calculatorTitle)),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => _buildBody(CalculatorConfig.fallback, l10n),
      data: (config) {
        if (_selectedSystemId == null && config.gradingSystems.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() =>
                  _selectedSystemId = config.gradingSystems.first.id);
            }
          });
        }
        return _buildBody(config, l10n);
      },
    );
  }

  Widget _buildBody(CalculatorConfig config, AppLocalizations l10n) {
    final calcResult = _calculate(config);
    final hasSubjects = _subjects.isNotEmpty;

    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          l10n.calculatorTitle,
          style: TextStyle(
            color: cs.onSurface,
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
              child: Icon(Icons.tune_rounded,
                  color: cs.onSurfaceVariant),
            ),
            tooltip: l10n.calculatorSettingsTooltip,
            onPressed: () =>
                setState(() => _settingsExpanded = !_settingsExpanded),
          ),
        ],
      ),
      body: Column(
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: _settingsExpanded
                ? _buildSettingsPanel(config, l10n)
                : const SizedBox.shrink(),
          ),

          Expanded(
            child: hasSubjects
                ? _buildSubjectList(config, calcResult, l10n)
                : _buildEmptyState(l10n),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: OutlinedButton.icon(
              onPressed: () => _showAddSubjectSheet(config),
              icon: const Icon(Icons.add_rounded),
              label: Text(l10n.calculatorAddSubject),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ),

          if (hasSubjects) _buildResultCard(calcResult, config, l10n),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildSettingsPanel(CalculatorConfig config, AppLocalizations l10n) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: cs.surface,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Divider(height: 1, color: cs.outlineVariant),
          const SizedBox(height: 14),

          if (config.gradingSystems.length > 1) ...[
            Text(
              l10n.calculatorGradingSystem,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurfaceVariant),
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
                    borderSide: BorderSide(color: cs.outlineVariant)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: cs.outlineVariant)),
              ),
              items: config.gradingSystems
                  .map((s) => DropdownMenuItem(
                        value: s.id,
                        child: Text(
                            s.name.isEmpty ? l10n.gradingSystemGermanDefault : s.name,
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
                    Text(l10n.calculatorClass,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurfaceVariant)),
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
                    Text(l10n.calculatorTerm,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurfaceVariant)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _termType,
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(color: cs.outlineVariant)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(color: cs.outlineVariant)),
                      ),
                      items: config.effectiveTermTypes
                          .map((t) => DropdownMenuItem(
                                value: t.code,
                                child: Text(
                                    t.name.isEmpty ? localizeTermType(l10n, t.code) : t.name,
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
                    Text(l10n.calculatorSchoolYear,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurfaceVariant)),
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
                            borderSide: BorderSide(color: cs.outlineVariant)),
                        hintText: l10n.calculatorSchoolYearHint,
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
                    Text(l10n.calculatorLabelOptional,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurfaceVariant)),
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
                            borderSide: BorderSide(color: cs.outlineVariant)),
                        hintText: l10n.calculatorLabelHint,
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

  Widget _buildEmptyState(AppLocalizations l10n) {
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
            Text(
              l10n.calculatorGradePlanner,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.calculatorGradePlannerHint,
              style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectList(CalculatorConfig config, _CalcResult result, AppLocalizations l10n) {
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
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
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
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: Theme.of(context).colorScheme.onSurface,
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
                            _tierDisplayLabel(tier, l10n),
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
                            style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
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
                '+${bonus.toStringAsFixed(1)} ${l10n.ptsAbbr}',
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
                  child: Icon(Icons.close_rounded,
                      size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
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
    final l10n = AppLocalizations.of(context)!;
    final existing = _subjects[index];
    final system = _resolveSystem(config);
    String pickedGrade = existing.grade;
    double pickedWeight = existing.weight;

    final gradeValues = system.gradeValues;
    final useGradeChips = gradeValues.isNotEmpty && gradeValues.length <= 10;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
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
                decoration: BoxDecoration(color: Theme.of(ctx).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: Text(existing.subject,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(ctx).colorScheme.onSurface))),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                onPressed: () { setState(() => _subjects.removeAt(index)); Navigator.of(sheetCtx).pop(); },
                tooltip: l10n.calculatorRemoveSubject,
              ),
            ]),
            const SizedBox(height: 16),
            Text(l10n.calculatorGradeLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(ctx).colorScheme.onSurface)),
            const SizedBox(height: 8),
            if (useGradeChips)
              Wrap(spacing: 8, runSpacing: 8, children: gradeValues.map((g) {
                final selected = pickedGrade == g;
                final tier = system.deriveTier(g);
                final tc = selected ? AppColors.tierColor(tier) : Theme.of(ctx).colorScheme.onSurfaceVariant;
                final tb = selected ? AppColors.tierColorLight(tier) : Theme.of(ctx).colorScheme.surfaceContainerHighest;
                return GestureDetector(
                  onTap: () => setSheet(() => pickedGrade = g),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: tb, borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: selected ? tc : Theme.of(ctx).colorScheme.outlineVariant, width: selected ? 2 : 1)),
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
              Text(l10n.calculatorWeightLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(ctx).colorScheme.onSurface)),
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
                child: Text(l10n.calculatorSaveChanges, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        );
      }),
    );
  }

  Widget _buildResultCard(_CalcResult result, CalculatorConfig config, AppLocalizations l10n) {
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

    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardColor.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withValues(alpha: 0.06),
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
                      Text(
                        l10n.calculatorTotalBonus,
                        style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${total.toStringAsFixed(1)} ${l10n.ptsAbbr}',
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
                    l10n.calculatorSubjectsLabel(_subjects.length),
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
                    : Text(l10n.calculatorSaveResult,
                        style: const TextStyle(
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
          color: selected ? AppColors.primary : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : Theme.of(context).colorScheme.outlineVariant,
            width: 1.5,
          ),
        ),
        child: Text(
          subject.name.isEmpty ? AppLocalizations.of(context)!.nameUnknown : subject.name,
          style: TextStyle(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? AppColors.white : Theme.of(context).colorScheme.onSurface,
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
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: cs.outlineVariant),
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
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: cs.onSurface,
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
              ? Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.4)
              : Theme.of(context).colorScheme.onSurfaceVariant,
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
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: cs.outlineVariant),
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
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: cs.onSurface,
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
