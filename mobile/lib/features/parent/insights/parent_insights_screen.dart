import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class ParentInsightsScreen extends StatelessWidget {
  const ParentInsightsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Insights')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('All Children — Summary', style: theme.textTheme.titleMedium),
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _Stat(label: 'Total Bonuses', value: '680 pts'),
                  _Stat(label: 'Unsettled', value: '340 pts'),
                  _Stat(label: 'Children', value: '2'),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          ...[
            _ChildInsightCard(name: 'Valerie', avgGrade: '1.8', pts: '380', tier: 'second'),
            _ChildInsightCard(name: 'Max', avgGrade: '2.4', pts: '300', tier: 'second'),
          ],
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  const _Stat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary)),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral600)),
  ]);
}

class _ChildInsightCard extends StatelessWidget {
  final String name, avgGrade, pts, tier;
  const _ChildInsightCard({required this.name, required this.avgGrade, required this.pts, required this.tier});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = AppColors.tierColor(tier);
    final lightColor = AppColors.tierColorLight(tier);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(backgroundColor: lightColor, child: Text(name[0], style: TextStyle(color: color, fontWeight: FontWeight.w700))),
            const SizedBox(width: 12),
            Text(name, style: theme.textTheme.titleMedium),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: lightColor, borderRadius: BorderRadius.circular(20)),
              child: Text('Grade $avgGrade', style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
            ),
          ]),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: double.parse(pts) / 600,
            backgroundColor: AppColors.neutral100,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            borderRadius: BorderRadius.circular(4),
            minHeight: 8,
          ),
          const SizedBox(height: 6),
          Text('$pts pts total', style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.neutral600)),
        ]),
      ),
    );
  }
}
