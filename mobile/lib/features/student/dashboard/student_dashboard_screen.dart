import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class StudentDashboardScreen extends ConsumerWidget {
  const StudentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateNotifierProvider);
    final userName = authAsync.valueOrNull?.name ?? 'Student';

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => context.push('/student/notes/capture'),
        child: const Icon(Icons.camera_alt_rounded),
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: _buildHeader(context, userName),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: _buildHeroCard(context),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                child: _buildSectionTitle(context, 'Recent Notes'),
              ),
            ),
            SliverToBoxAdapter(
              child: _buildRecentNotes(context),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                child: _buildSectionTitle(context, 'Saved Results'),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: _buildSavedResults(context),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                child: OutlinedButton.icon(
                  onPressed: () => context.go('/student/calculator'),
                  icon: const Icon(Icons.calculate_rounded),
                  label: const Text('Quick Calculate'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String name) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hi $name \u{1F44B}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.neutral900,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Track your grades, earn rewards',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        CircleAvatar(
          backgroundColor: AppColors.primaryLight,
          radius: 22,
          child: const Icon(
            Icons.person_rounded,
            color: AppColors.primary,
            size: 24,
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(BuildContext context) {
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
                'This Week',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.white.withValues(alpha: 0.85),
                    ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Cycle 2',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.white,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '47 pts',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Jan 13 – Feb 7, 2026',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.white.withValues(alpha: 0.75),
                ),
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: 0.62,
              backgroundColor: AppColors.white.withValues(alpha: 0.25),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.white),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '62% of cycle complete',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
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
            color: AppColors.neutral900,
          ),
    );
  }

  Widget _buildRecentNotes(BuildContext context) {
    const notes = [
      _NotePreview(subject: 'Mathematics', grade: '2', pts: '+12 pts', tier: 'second'),
      _NotePreview(subject: 'Biology', grade: '1', pts: '+20 pts', tier: 'best'),
      _NotePreview(subject: 'English', grade: '3', pts: '+8 pts', tier: 'third'),
    ];

    return SizedBox(
      height: 116,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: notes.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final note = notes[index];
          final color = AppColors.tierColor(note.tier);
          final lightColor = AppColors.tierColorLight(note.tier);
          return Container(
            width: 148,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  note.subject,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.neutral700,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: lightColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        note.grade,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: color,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                    Text(
                      note.pts,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSavedResults(BuildContext context) {
    const results = [
      _ResultPreview(label: 'Maths 2025', average: '2.3', pts: '120 pts', tier: 'second'),
      _ResultPreview(label: 'German 2024/2', average: '1.8', pts: '95 pts', tier: 'second'),
    ];

    return Column(
      children: results.map((r) {
        final color = AppColors.tierColor(r.tier);
        final lightColor = AppColors.tierColorLight(r.tier);
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.neutral200),
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
                      r.average,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
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
                        r.label,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.neutral900,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${r.average} avg',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: lightColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    r.pts,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _NotePreview {
  final String subject;
  final String grade;
  final String pts;
  final String tier;

  const _NotePreview({
    required this.subject,
    required this.grade,
    required this.pts,
    required this.tier,
  });
}

class _ResultPreview {
  final String label;
  final String average;
  final String pts;
  final String tier;

  const _ResultPreview({
    required this.label,
    required this.average,
    required this.pts,
    required this.tier,
  });
}
