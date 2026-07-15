import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/quick_grades_provider.dart';
import '../providers/term_results_provider.dart';
import '../../../../models/quick_grade.dart';
import '../../../../models/term_result.dart';
import '../../../../utils/term_type_utils.dart';

class StudentDashboardScreen extends ConsumerWidget {
  const StudentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final authAsync = ref.watch(authStateNotifierProvider);
    final userName = authAsync.valueOrNull?.name ?? l10n.registerRoleStudentTitle;
    final gradesAsync = ref.watch(quickGradesProvider);
    final termsAsync = ref.watch(termResultsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => context.push('/student/notes/capture'),
        child: const Icon(Icons.camera_alt_rounded),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await Future.wait([
              ref.read(quickGradesProvider.notifier).reload(),
              ref.read(termResultsProvider.notifier).reload(),
            ]);
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _buildHeader(context, l10n, userName),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: _buildHeroCard(context, l10n, gradesAsync),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                  child: _buildSectionTitle(context, l10n.dashboardRecentNotes),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildRecentNotes(context, l10n, gradesAsync),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                  child: _buildSectionTitle(context, l10n.dashboardSavedResults),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: _buildSavedResults(context, l10n, termsAsync),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/student/calculator'),
                    icon: const Icon(Icons.calculate_rounded),
                    label: Text(l10n.dashboardQuickCalculate),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppLocalizations l10n, String name) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.dashboardHiName(name),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                l10n.dashboardSubtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: () => context.push('/student/settings'),
          child: const CircleAvatar(
            backgroundColor: AppColors.primaryLight,
            radius: 22,
            child: Icon(
              Icons.person_rounded,
              color: AppColors.primary,
              size: 24,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(
      BuildContext context, AppLocalizations l10n, AsyncValue<List<QuickGrade>> gradesAsync) {
    final grades = gradesAsync.valueOrNull ?? [];

    // This week grades
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final thisWeekGrades = grades.where((g) {
      return g.gradedAt.isAfter(
          DateTime(weekStart.year, weekStart.month, weekStart.day)
              .subtract(const Duration(seconds: 1)));
    }).toList();
    final weekPts =
        thisWeekGrades.fold<double>(0.0, (sum, g) => sum + g.bonusPoints);

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.dashboardThisWeek,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.white.withValues(alpha: 0.85),
                    ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l10n.studentNotesCount(thisWeekGrades.length),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.white,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${weekPts % 1 == 0 ? weekPts.toInt() : weekPts.toStringAsFixed(1)} ${l10n.ptsAbbr}',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            '${DateFormat('MMM d').format(weekStart)} – ${DateFormat('MMM d, yyyy').format(weekStart.add(const Duration(days: 6)))}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.white.withValues(alpha: 0.75),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
    );
  }

  Widget _buildRecentNotes(
      BuildContext context, AppLocalizations l10n, AsyncValue<List<QuickGrade>> gradesAsync) {
    return gradesAsync.when(
      loading: () => const SizedBox(
        height: 116,
        child: Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => SizedBox(
        height: 60,
        child: Center(
          child: Text(l10n.dashboardCouldNotLoadNotes,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ),
      ),
      data: (grades) {
        if (grades.isEmpty) {
          return SizedBox(
            height: 60,
            child: Center(
              child: Text(l10n.dashboardNoNotesYet,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
          );
        }

        final sorted = [...grades]
          ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
        final recent = sorted.take(5).toList();

        return SizedBox(
          height: 116,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: recent.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final grade = recent[index];
              final color = AppColors.tierColor(grade.gradeQualityTier);
              final lightColor =
                  AppColors.tierColorLight(grade.gradeQualityTier);
              return GestureDetector(
                onTap: () => context.push('/student/notes/detail/${grade.id}'),
                child: Container(
                width: 148,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      grade.localizedName(Localizations.localeOf(context).languageCode, fallback: l10n.subjectFallback),
                      style:
                          Theme.of(context).textTheme.labelLarge?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: lightColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            grade.gradeValue,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: color,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        Text(
                          '+${grade.bonusPoints % 1 == 0 ? grade.bonusPoints.toInt() : grade.bonusPoints.toStringAsFixed(1)} ${l10n.ptsAbbr}',
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(
                                color: color,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildSavedResults(
      BuildContext context, AppLocalizations l10n, AsyncValue<List<TermResult>> termsAsync) {
    return termsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Text(l10n.dashboardCouldNotLoadResults,
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ),
      data: (terms) {
        if (terms.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(l10n.dashboardNoSavedResultsYet,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
          );
        }

        final recent = terms.take(3).toList();

        return Column(
          children: recent.map((term) {
            final color = AppColors.tierColor(term.tier);
            final lightColor = AppColors.tierColorLight(term.tier);
            final avg = term.averageGrade;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => context.push('/student/results/${term.id}'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: lightColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          avg != null ? avg.toStringAsFixed(1) : '-',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: color,
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizeTermLabel(l10n, term.termType, term.schoolYear, term.termName),
                            style:
                                Theme.of(context).textTheme.titleMedium?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurface,
                                    ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            l10n.calculatorSubjectsLabel(term.subjects.length),
                            style:
                                Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: lightColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${term.totalBonusPoints % 1 == 0 ? term.totalBonusPoints.toInt() : term.totalBonusPoints.toStringAsFixed(1)} ${l10n.ptsAbbr}',
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: color,
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ),
                  ],
                ),
              ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
