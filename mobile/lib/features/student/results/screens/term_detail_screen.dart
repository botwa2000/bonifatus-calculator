import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class TermDetailScreen extends StatelessWidget {
  final String termId;
  const TermDetailScreen({super.key, required this.termId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Term Result')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Maths — Semester 1 2025', style: theme.textTheme.titleLarge),
                const SizedBox(height: 16),
                Row(children: [
                  _Stat(label: 'Average', value: '2.1', color: AppColors.tierSecond),
                  const SizedBox(width: 24),
                  _Stat(label: 'Bonus', value: '110 pts', color: AppColors.success),
                  const SizedBox(width: 24),
                  _Stat(label: 'Subjects', value: '5', color: AppColors.neutral600),
                ]),
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 12),
                Text('Subject Breakdown', style: theme.textTheme.labelLarge?.copyWith(color: AppColors.neutral600)),
                const SizedBox(height: 12),
                ...['Algebra / 2', 'Geometry / 2', 'Statistics / 3', 'Calculus / 1', 'Trigonometry / 2'].map((s) {
                  final parts = s.split(' / ');
                  final grade = double.tryParse(parts[1]) ?? 2.0;
                  final tier = grade < 1.5 ? 'best' : grade < 2.5 ? 'second' : grade < 3.5 ? 'third' : 'below';
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(children: [
                      Expanded(child: Text(parts[0], style: theme.textTheme.bodyMedium)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.tierColorLight(tier),
                          borderRadius: BorderRadius.circular(6)),
                        child: Text(parts[1], style: TextStyle(color: AppColors.tierColor(tier), fontWeight: FontWeight.w700)),
                      ),
                    ]),
                  );
                }),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _Stat({required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral600)),
    const SizedBox(height: 4),
    Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
  ]);
}
