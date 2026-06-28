import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key});

  static const _terms = [
    _Term(id: '1', label: 'Maths — S1 2025', average: '2.1', tier: 'second', pts: '110'),
    _Term(id: '2', label: 'Biology — S1 2025', average: '1.3', tier: 'best', pts: '180'),
    _Term(id: '3', label: 'English — S2 2024', average: '3.2', tier: 'third', pts: '65'),
    _Term(id: '4', label: 'Physics — S2 2024', average: '4.0', tier: 'below', pts: '-20'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            title: const Text('Saved Results'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => context.go('/student/calculator'),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  final term = _terms[i];
                  final color = AppColors.tierColor(term.tier);
                  final lightColor = AppColors.tierColorLight(term.tier);
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.push('/student/results/${term.id}'),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(color: lightColor, borderRadius: BorderRadius.circular(8)),
                            child: Text(term.average, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 18)),
                          ),
                          const SizedBox(width: 14),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(term.label, style: theme.textTheme.titleMedium),
                            const SizedBox(height: 2),
                            Text('${term.pts} pts', style: theme.textTheme.bodyMedium?.copyWith(
                              color: term.pts.startsWith('-') ? AppColors.error : AppColors.success)),
                          ])),
                          const Icon(Icons.chevron_right, color: AppColors.neutral400),
                        ]),
                      ),
                    ),
                  );
                },
                childCount: _terms.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Term {
  final String id, label, average, tier, pts;
  const _Term({required this.id, required this.label, required this.average, required this.tier, required this.pts});
}
