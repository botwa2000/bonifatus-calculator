import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class _SettlementCard {
  final String childName;
  final int amount;
  final String type;

  const _SettlementCard({
    required this.childName,
    required this.amount,
    required this.type,
  });
}

class _ActivityItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;

  const _ActivityItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
  });
}

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  static const List<_SettlementCard> _settlements = [
    _SettlementCard(childName: "Lena M.", amount: 240, type: "Term Grade Bonus"),
    _SettlementCard(childName: "Tom M.", amount: 100, type: "Term Grade Bonus"),
  ];

  static const List<_ActivityItem> _activities = [
    _ActivityItem(
      title: "Lena M. captured a grade",
      subtitle: "Mathematics · Grade 2 · +8 pts",
      icon: Icons.camera_alt_outlined,
      iconColor: AppColors.tierBest,
    ),
    _ActivityItem(
      title: "Tom M. captured a grade",
      subtitle: "Physics · Grade 3 · +5 pts",
      icon: Icons.camera_alt_outlined,
      iconColor: AppColors.tierSecond,
    ),
    _ActivityItem(
      title: "Weekly cycle settled",
      subtitle: "Lena M. · Jan 6–12 · 42 pts",
      icon: Icons.check_circle_outline_rounded,
      iconColor: AppColors.primary,
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateNotifierProvider);
    final userName = authAsync.valueOrNull?.name ?? "Parent";

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: _buildHeader(userName),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: _buildSummaryCard(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                child: _buildSectionTitle("Pending Settlements"),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildSettlements(context),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 10),
                child: _buildSectionTitle("Recent Activity"),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                child: _buildActivity(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String userName) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Hi $userName",
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.neutral900,
              ),
            ),
            const Text(
              "Overview of your children",
              style: TextStyle(
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

  Widget _buildSummaryCard() {
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
          const Text(
            "Summary",
            style: TextStyle(
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
                  label: "Children",
                  value: "2",
                  icon: Icons.people_outline_rounded,
                ),
              ),
              Container(
                width: 1,
                height: 50,
                color: Colors.white.withValues(alpha: 0.2),
              ),
              Expanded(
                child: _SummaryStatItem(
                  label: "Unsettled",
                  value: "340 pts",
                  icon: Icons.account_balance_wallet_outlined,
                ),
              ),
              Container(
                width: 1,
                height: 50,
                color: Colors.white.withValues(alpha: 0.2),
              ),
              Expanded(
                child: _SummaryStatItem(
                  label: "Active Cycles",
                  value: "3",
                  icon: Icons.loop_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AppColors.neutral900,
      ),
    );
  }

  Widget _buildSettlements(BuildContext context) {
    return Column(
      children: _settlements.map((s) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _SettlementItemCard(settlement: s),
        );
      }).toList(),
    );
  }

  Widget _buildActivity() {
    return Container(
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
        children: List.generate(_activities.length, (i) {
          final item = _activities[i];
          return Column(
            children: [
              ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: item.iconColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, size: 20, color: item.iconColor),
                ),
                title: Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.neutral900,
                  ),
                ),
                subtitle: Text(
                  item.subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutral600,
                  ),
                ),
              ),
              if (i < _activities.length - 1)
                const Divider(height: 1, indent: 16, endIndent: 16, color: AppColors.neutral100),
            ],
          );
        }),
      ),
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
            style: const TextStyle(
              color: Colors.white60,
              fontSize: 11,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SettlementItemCard extends StatelessWidget {
  final _SettlementCard settlement;

  const _SettlementItemCard({required this.settlement});

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Row(
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
              settlement.childName.substring(0, 1),
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
                  settlement.childName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  settlement.type,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutral600,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "${settlement.amount} pts",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.tierBest,
                ),
              ),
              const SizedBox(height: 4),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text("Settle"),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
