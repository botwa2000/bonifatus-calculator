import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class NoteDetailScreen extends StatelessWidget {
  final String noteId;

  const NoteDetailScreen({super.key, required this.noteId});

  @override
  Widget build(BuildContext context) {
    const subject = "Mathematics";
    const grade = "2";
    const bonusPts = 8;
    const cyclePeriod = "Jan 13 – Jan 19, 2025";
    const dateCaptured = "Jan 17, 2025";
    const ocrConfidence = 0.85;
    const noteText = "Excellent work on the quadratic equations chapter test.";
    const tier = "best";

    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);

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
          "Note Detail",
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded,
                color: AppColors.error),
            onPressed: () => _showDeleteDialog(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.neutral900.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: tierColorLight,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          grade,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: tierColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              subject,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.neutral900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.tierBest.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                "+$bonusPts bonus pts",
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.tierBest,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(color: AppColors.neutral100),
                  const SizedBox(height: 16),
                  _DetailRow(
                    icon: Icons.date_range_outlined,
                    label: "Cycle Period",
                    value: cyclePeriod,
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    icon: Icons.schedule_rounded,
                    label: "Date Captured",
                    value: dateCaptured,
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    icon: Icons.fingerprint_rounded,
                    label: "OCR Confidence",
                    value: "${(ocrConfidence * 100).round()}%",
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ocrConfidence,
                      backgroundColor: AppColors.neutral100,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        ocrConfidence >= 0.8
                            ? AppColors.tierBest
                            : ocrConfidence >= 0.6
                                ? AppColors.tierThird
                                : AppColors.tierBelow,
                      ),
                      minHeight: 6,
                    ),
                  ),
                  if (noteText.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Divider(color: AppColors.neutral100),
                    const SizedBox(height: 12),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "Note",
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.neutral50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        noteText,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.neutral700,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                "Note ID: $noteId",
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.neutral400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          "Delete Note",
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        content: const Text(
          "Are you sure you want to delete this note? This action cannot be undone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.neutral400),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.neutral600,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.neutral900,
          ),
        ),
      ],
    );
  }
}
