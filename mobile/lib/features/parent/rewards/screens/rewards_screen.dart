import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class _TermGradeItem {
  final String subject;
  final String grade;
  final int pts;
  final String tier;

  const _TermGradeItem({
    required this.subject,
    required this.grade,
    required this.pts,
    required this.tier,
  });
}

class _ChildTermSection {
  final String childName;
  final List<_TermGradeItem> items;
  final int totalPts;

  const _ChildTermSection({
    required this.childName,
    required this.items,
    required this.totalPts,
  });
}

class _CycleSummary {
  final String childName;
  final String cycleType;
  final String dateRange;
  final int netPts;
  final String status;

  const _CycleSummary({
    required this.childName,
    required this.cycleType,
    required this.dateRange,
    required this.netPts,
    required this.status,
  });
}

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  static const List<_ChildTermSection> _termSections = [
    _ChildTermSection(
      childName: "Lena M.",
      totalPts: 240,
      items: [
        _TermGradeItem(subject: "Mathematics", grade: "1", pts: 100, tier: "best"),
        _TermGradeItem(subject: "English", grade: "2", pts: 80, tier: "best"),
        _TermGradeItem(subject: "Biology", grade: "3", pts: 60, tier: "second"),
      ],
    ),
    _ChildTermSection(
      childName: "Tom M.",
      totalPts: 100,
      items: [
        _TermGradeItem(subject: "Physics", grade: "2", pts: 80, tier: "best"),
        _TermGradeItem(subject: "History", grade: "4", pts: 20, tier: "third"),
      ],
    ),
  ];

  static const List<_CycleSummary> _cycleSummaries = [
    _CycleSummary(
      childName: "Lena M.",
      cycleType: "Weekly",
      dateRange: "Jan 13 – Jan 19",
      netPts: 15,
      status: "Pending",
    ),
    _CycleSummary(
      childName: "Tom M.",
      cycleType: "Weekly",
      dateRange: "Jan 13 – Jan 19",
      netPts: 8,
      status: "Pending",
    ),
    _CycleSummary(
      childName: "Lena M.",
      cycleType: "Monthly",
      dateRange: "January 2025",
      netPts: 42,
      status: "Settled",
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.neutral50,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          title: const Text(
            "Rewards",
            style: TextStyle(
              color: AppColors.neutral900,
              fontWeight: FontWeight.w700,
              fontSize: 20,
            ),
          ),
          bottom: const TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.neutral400,
            indicatorColor: AppColors.primary,
            labelStyle: TextStyle(fontWeight: FontWeight.w600),
            tabs: [
              Tab(text: "Term Grades"),
              Tab(text: "Ongoing Cycles"),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _TermGradesTab(sections: _termSections),
            _OngoingCyclesTab(summaries: _cycleSummaries),
          ],
        ),
      ),
    );
  }
}

class _TermGradesTab extends StatelessWidget {
  final List<_ChildTermSection> sections;

  const _TermGradesTab({required this.sections});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sections.length,
      itemBuilder: (ctx, i) {
        final section = sections[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _TermSectionCard(
            section: section,
            onSettle: () => _showSettleSheet(context, section),
          ),
        );
      },
    );
  }

  void _showSettleSheet(BuildContext context, _ChildTermSection section) {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Settle Term Bonus for ${section.childName}",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.tierBestLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Amount to transfer",
                    style: TextStyle(
                      color: AppColors.neutral700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    "${section.totalPts} pts",
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.tierBest,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.neutral200),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "Cancel",
                      style: TextStyle(color: AppColors.neutral700),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "Confirm Settle",
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _TermSectionCard extends StatelessWidget {
  final _ChildTermSection section;
  final VoidCallback onSettle;

  const _TermSectionCard({required this.section, required this.onSettle});

  @override
  Widget build(BuildContext context) {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    section.childName.substring(0, 1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  section.childName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
                  ),
                ),
                const Spacer(),
                Text(
                  "${section.totalPts} pts total",
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tierBest,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: AppColors.neutral100),
          ...section.items.map(
            (item) => _TermGradeRow(item: item),
          ),
          const Divider(height: 1, color: AppColors.neutral100),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onSettle,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  "Settle",
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TermGradeRow extends StatelessWidget {
  final _TermGradeItem item;

  const _TermGradeRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(item.tier);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: tierColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.subject,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.neutral700,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: tierColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              "Grade ${item.grade}",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: tierColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            "+${item.pts} pts",
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.tierBest,
            ),
          ),
        ],
      ),
    );
  }
}

class _OngoingCyclesTab extends StatelessWidget {
  final List<_CycleSummary> summaries;

  const _OngoingCyclesTab({required this.summaries});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: summaries.length,
      itemBuilder: (ctx, i) {
        final summary = summaries[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _CycleSummaryCard(
            summary: summary,
            onSettle: () => _showCycleSettleSheet(context, summary),
          ),
        );
      },
    );
  }

  void _showCycleSettleSheet(BuildContext context, _CycleSummary summary) {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Settle Cycle for ${summary.childName}",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "${summary.cycleType} — ${summary.dateRange}",
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.neutral600,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: summary.netPts >= 0
                    ? AppColors.tierBestLight
                    : AppColors.tierBelowLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Net pts to transfer",
                    style: TextStyle(
                      color: AppColors.neutral700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    "${summary.netPts} pts",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: summary.netPts >= 0
                          ? AppColors.tierBest
                          : AppColors.tierBelow,
                    ),
                  ),
                ],
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
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  "Confirm Settle",
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _CycleSummaryCard extends StatelessWidget {
  final _CycleSummary summary;
  final VoidCallback onSettle;

  const _CycleSummaryCard({required this.summary, required this.onSettle});

  @override
  Widget build(BuildContext context) {
    final isPending = summary.status == "Pending";
    final netPositive = summary.netPts >= 0;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      summary.childName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.neutral900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${summary.cycleType} · ${summary.dateRange}",
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.neutral600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isPending
                      ? AppColors.warning.withValues(alpha: 0.12)
                      : AppColors.tierBest.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  summary.status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isPending ? AppColors.warning : AppColors.tierBest,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Net: ${summary.netPts} pts",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: netPositive ? AppColors.tierBest : AppColors.tierBelow,
                ),
              ),
              if (isPending)
                ElevatedButton(
                  onPressed: onSettle,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    "Settle Cycle",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
