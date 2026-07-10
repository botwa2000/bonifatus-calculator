import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/children_provider.dart';
import '../../../../models/child_data.dart';

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final authAsync = ref.watch(authStateNotifierProvider);
    final userName = authAsync.valueOrNull?.name ?? 'Parent';
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () =>
              ref.read(childrenQuickGradesProvider.notifier).reload(),
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
                  child: _buildSummaryCard(context, l10n, childrenAsync),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                  child: _buildSectionTitle(context, l10n.parentDashboardChildrenOverview),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding:
                      const EdgeInsets.fromLTRB(20, 0, 20, 40),
                  child: _buildChildrenList(context, l10n, childrenAsync),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppLocalizations l10n, String userName) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.parentDashboardHiName(userName),
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.neutral900,
              ),
            ),
            Text(
              l10n.parentDashboardOverview,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.neutral600,
              ),
            ),
          ],
        ),
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: AppColors.primaryLight,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.notifications_none_rounded,
            color: AppColors.primary,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(BuildContext context, AppLocalizations l10n, AsyncValue<List<ChildWithGrades>> childrenAsync) {
    final children = childrenAsync.valueOrNull ?? [];
    final childCount = children.length;
    final totalPending = children.fold<int>(
        0, (sum, c) => sum + c.totalPendingPoints);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.parentDashboardSummary,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _SummaryStatItem(
                  label: l10n.parentDashboardChildren,
                  value: childCount.toString(),
                  icon: Icons.people_outline_rounded,
                ),
              ),
              Container(
                  width: 1,
                  height: 50,
                  color: Colors.white.withValues(alpha: 0.2)),
              Expanded(
                child: _SummaryStatItem(
                  label: l10n.parentDashboardPending,
                  value: '$totalPending pts',
                  icon: Icons.account_balance_wallet_outlined,
                ),
              ),
              Container(
                  width: 1,
                  height: 50,
                  color: Colors.white.withValues(alpha: 0.2)),
              Expanded(
                child: _SummaryStatItem(
                  label: l10n.parentDashboardGrades,
                  value: children
                      .fold<int>(0, (s, c) => s + c.grades.length)
                      .toString(),
                  icon: Icons.grade_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AppColors.neutral900,
      ),
    );
  }

  Widget _buildChildrenList(
      BuildContext context, AppLocalizations l10n, AsyncValue<List<ChildWithGrades>> childrenAsync) {
    return childrenAsync.when(
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary)),
      error: (_, __) => Center(
        child: Text(l10n.parentDashboardCouldNotLoadChildren,
            style: const TextStyle(color: AppColors.neutral600)),
      ),
      data: (children) {
        if (children.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                l10n.parentDashboardNoChildrenConnected,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.neutral600, fontSize: 14),
              ),
            ),
          );
        }

        return Column(
          children: children.map((child) {
            final tier = child.latestTier;
            final tierColor = AppColors.tierColor(tier);
            final tierColorLight = AppColors.tierColorLight(tier);
            final recentGrades = [...child.grades]
              ..sort((a, b) => b.gradedAt.compareTo(a.gradedAt));

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => context.push('/parent/children/${child.childId}'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.neutral900.withValues(alpha: 0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            child.childName.substring(0, 1).toUpperCase(),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                child.childName,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.neutral900,
                                ),
                              ),
                              Text(
                                l10n.parentDashboardChildSubtitle(child.grades.length, child.totalPendingPoints),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.neutral600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (recentGrades.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: AppColors.neutral100),
                      const SizedBox(height: 10),
                      Text(
                        l10n.parentDashboardRecentGrade,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral400,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: tierColorLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              recentGrades.first.gradeValue,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: tierColor,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            recentGrades.first.subjectName ?? 'Subject',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.neutral700,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '+${recentGrades.first.bonusPoints} pts',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.tierBest,
                            ),
                          ),
                        ],
                      ),
                    ],
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

class _SummaryStatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _SummaryStatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
