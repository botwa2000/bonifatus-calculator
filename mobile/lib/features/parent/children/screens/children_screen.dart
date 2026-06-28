import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/theme/app_colors.dart';

class _ChildItem {
  final String id;
  final String name;
  final String tier;
  final int totalPtsThisMonth;
  final String grade;

  const _ChildItem({
    required this.id,
    required this.name,
    required this.tier,
    required this.totalPtsThisMonth,
    required this.grade,
  });
}

class ChildrenScreen extends StatelessWidget {
  const ChildrenScreen({super.key});

  static const List<_ChildItem> _children = [
    _ChildItem(id: "c1", name: "Lena M.", tier: "best", totalPtsThisMonth: 120, grade: "7"),
    _ChildItem(id: "c2", name: "Tom M.", tier: "second", totalPtsThisMonth: 85, grade: "5"),
  ];

  static const String _inviteUrl = "https://bonifatus.com/invite?code=PLACEHOLDER";

  @override
  Widget build(BuildContext context) {
    final isEmpty = _children.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          "Children",
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => _showQrDialog(context),
        child: const Icon(Icons.qr_code_rounded),
      ),
      body: isEmpty ? _buildEmptyState(context) : _buildList(context),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: const BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.people_outline_rounded,
                size: 56,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "No children connected",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              "Share an invite QR code to connect with a student",
              style: TextStyle(fontSize: 15, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showQrDialog(context),
              icon: const Icon(Icons.qr_code_rounded),
              label: const Text("Show Invite QR"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _children.length,
      itemBuilder: (ctx, i) {
        final child = _children[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _ChildCard(
            child: child,
            onView: () => context.push("/parent/children/${child.id}"),
          ),
        );
      },
    );
  }

  void _showQrDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Invite a Student",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Ask the student to scan this code in their app",
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.neutral600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              QrImageView(
                data: _inviteUrl,
                size: 200,
                backgroundColor: Colors.white,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.neutral100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  _inviteUrl,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.neutral600,
                    fontFamily: "JetBrainsMono",
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text("Close"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChildCard extends StatelessWidget {
  final _ChildItem child;
  final VoidCallback onView;

  const _ChildCard({required this.child, required this.onView});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(child.tier);
    final tierColorLight = AppColors.tierColorLight(child.tier);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              child.name.substring(0, 1),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  child.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: tierColorLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "Grade ${child.grade}",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: tierColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "${child.totalPtsThisMonth} pts this month",
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.neutral600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onView,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryLight,
              foregroundColor: AppColors.primary,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              "View",
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
