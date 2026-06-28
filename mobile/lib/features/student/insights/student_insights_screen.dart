import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_colors.dart';

class StudentInsightsScreen extends StatelessWidget {
  const StudentInsightsScreen({super.key});

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
                Text('Bonus Points — Last 6 Months', style: theme.textTheme.titleMedium),
                const SizedBox(height: 20),
                SizedBox(
                  height: 160,
                  child: BarChart(BarChartData(
                    barGroups: [
                      BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 85, color: AppColors.primary, width: 18, borderRadius: BorderRadius.circular(4))]),
                      BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 120, color: AppColors.primary, width: 18, borderRadius: BorderRadius.circular(4))]),
                      BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 95, color: AppColors.primary, width: 18, borderRadius: BorderRadius.circular(4))]),
                      BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 145, color: AppColors.tierBest, width: 18, borderRadius: BorderRadius.circular(4))]),
                      BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 110, color: AppColors.primary, width: 18, borderRadius: BorderRadius.circular(4))]),
                      BarChartGroupData(x: 5, barRods: [BarChartRodData(toY: 47, color: AppColors.secondary, width: 18, borderRadius: BorderRadius.circular(4))]),
                    ],
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 24,
                        getTitlesWidget: (v, _) {
                          const labels = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
                          final i = v.toInt();
                          return i < labels.length ? Text(labels[i], style: const TextStyle(fontSize: 11, color: AppColors.neutral400)) : const SizedBox();
                        }
                      )),
                    ),
                    gridData: FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                  )),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Grade Distribution', style: theme.textTheme.titleMedium),
                const SizedBox(height: 16),
                Row(children: [
                  SizedBox(
                    height: 120, width: 120,
                    child: PieChart(PieChartData(
                      sections: [
                        PieChartSectionData(value: 35, color: AppColors.tierBest, title: '', radius: 40),
                        PieChartSectionData(value: 40, color: AppColors.tierSecond, title: '', radius: 40),
                        PieChartSectionData(value: 18, color: AppColors.tierThird, title: '', radius: 40),
                        PieChartSectionData(value: 7, color: AppColors.tierBelow, title: '', radius: 40),
                      ],
                      sectionsSpace: 2,
                      centerSpaceRadius: 24,
                    )),
                  ),
                  const SizedBox(width: 20),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _LegendRow(color: AppColors.tierBest, label: 'Best (1–1.4)', pct: '35%'),
                    _LegendRow(color: AppColors.tierSecond, label: 'Good (1.5–2.4)', pct: '40%'),
                    _LegendRow(color: AppColors.tierThird, label: 'OK (2.5–3.4)', pct: '18%'),
                    _LegendRow(color: AppColors.tierBelow, label: 'Below (3.5+)', pct: '7%'),
                  ]),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('This Week Total', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _BigStat(label: 'Notes', value: '5'),
                  _BigStat(label: 'Positive', value: '+62 pts'),
                  _BigStat(label: 'Net', value: '+47 pts'),
                ]),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label, pct;
  const _LegendRow({required this.color, required this.label, required this.pct});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 6),
      Text(label, style: const TextStyle(fontSize: 12)),
      const SizedBox(width: 4),
      Text(pct, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
    ]),
  );
}

class _BigStat extends StatelessWidget {
  final String label, value;
  const _BigStat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primary)),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral600)),
  ]);
}
