import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class _CycleNote {
  final String subject;
  final String grade;
  final int bonusPts;
  final String date;
  final String tier;

  const _CycleNote({
    required this.subject,
    required this.grade,
    required this.bonusPts,
    required this.date,
    required this.tier,
  });
}

class CycleSummaryScreen extends StatelessWidget {
  final String cycleId;

  const CycleSummaryScreen({super.key, required this.cycleId});

  static const List<_CycleNote> _notes = [
    _CycleNote(subject: "Mathematics", grade: "2", bonusPts: 8, date: "Jan 17", tier: "best"),
    _CycleNote(subject: "English", grade: "3", bonusPts: 5, date: "Jan 15", tier: "second"),
    _CycleNote(subject: "Biology", grade: "4", bonusPts: 2, date: "Jan 14", tier: "third"),
  ];

  @override
  Widget build(BuildContext context) {
    const cycleType = "Weekly";
    const startDate = "Jan 13, 2025";
    const endDate = "Jan 19, 2025";
    const totalPositive = 15;
    const totalNegative = 0;
    const netPts = totalPositive - totalNegative;
    const settlementStatus = "Pending";

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          "Cycle Summary",
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeaderCard(
              cycleType: cycleType,
              startDate: startDate,
              endDate: endDate,
              totalPositive: totalPositive,
              totalNegative: totalNegative,
              netPts: netPts,
              settlementStatus: settlementStatus,
            ),
            const SizedBox(height: 24),
            const Text(
              "Notes in this Cycle",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 12),
            ..._notes.map(
              (note) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _CycleNoteCard(note: note),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                "Cycle ID: $cycleId",
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.neutral400,
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard({
    required String cycleType,
    required String startDate,
    required String endDate,
    required int totalPositive,
    required int totalNegative,
    required int netPts,
    required String settlementStatus,
  }) {
    final netColor = netPts >= 0 ? AppColors.tierBest : AppColors.tierBelow;
    final netBg = netPts >= 0 ? AppColors.tierBestLight : AppColors.tierBelowLight;
    final isPending = settlementStatus == "Pending";

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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  cycleType,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isPending
                      ? AppColors.warning.withValues(alpha: 0.9)
                      : AppColors.tierBest.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  settlementStatus,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            "$startDate – $endDate",
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _StatBox(
                  label: "Positive",
                  value: "+$totalPositive pts",
                  valueColor: Colors.white,
                  bgColor: Colors.white.withValues(alpha: 0.15),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatBox(
                  label: "Negative",
                  value: "-$totalNegative pts",
                  valueColor: Colors.white,
                  bgColor: Colors.white.withValues(alpha: 0.15),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatBox(
                  label: "Net",
                  value: "$netPts pts",
                  valueColor: netColor,
                  bgColor: netBg,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  final Color bgColor;

  const _StatBox({
    required this.label,
    required this.value,
    required this.valueColor,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: valueColor.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _CycleNoteCard extends StatelessWidget {
  final _CycleNote note;

  const _CycleNoteCard({required this.note});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(note.tier);
    final tierColorLight = AppColors.tierColorLight(note.tier);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: tierColorLight,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Text(
              note.grade,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: tierColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  note.subject,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.neutral900,
                  ),
                ),
                Text(
                  note.date,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutral400,
                  ),
                ),
              ],
            ),
          ),
          Text(
            "+${note.bonusPts} pts",
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.tierBest,
            ),
          ),
        ],
      ),
    );
  }
}
