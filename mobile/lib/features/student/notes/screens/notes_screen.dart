import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class _NoteItem {
  final String id;
  final String subject;
  final String grade;
  final int bonusPts;
  final String date;
  final String tier;
  final String cycleId;

  const _NoteItem({
    required this.id,
    required this.subject,
    required this.grade,
    required this.bonusPts,
    required this.date,
    required this.tier,
    required this.cycleId,
  });
}

class _CycleGroup {
  final String cycleId;
  final String label;
  final List<_NoteItem> notes;

  const _CycleGroup({
    required this.cycleId,
    required this.label,
    required this.notes,
  });
}

class NotesScreen extends ConsumerWidget {
  const NotesScreen({super.key});

  static final List<_CycleGroup> _groups = [
    _CycleGroup(
      cycleId: "cycle-1",
      label: "This Week — Jan 13–19",
      notes: [
        _NoteItem(id: "n1", subject: "Mathematics", grade: "2", bonusPts: 8, date: "Jan 17", tier: "best", cycleId: "cycle-1"),
        _NoteItem(id: "n2", subject: "English", grade: "3", bonusPts: 5, date: "Jan 15", tier: "second", cycleId: "cycle-1"),
        _NoteItem(id: "n3", subject: "Biology", grade: "4", bonusPts: 2, date: "Jan 14", tier: "third", cycleId: "cycle-1"),
      ],
    ),
    _CycleGroup(
      cycleId: "cycle-2",
      label: "Last Week — Jan 6–12",
      notes: [
        _NoteItem(id: "n4", subject: "Physics", grade: "2", bonusPts: 8, date: "Jan 10", tier: "best", cycleId: "cycle-2"),
        _NoteItem(id: "n5", subject: "History", grade: "5", bonusPts: 0, date: "Jan 8", tier: "below", cycleId: "cycle-2"),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isEmpty = _groups.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          "Notes",
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
            onPressed: () => context.push("/student/notes/capture"),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => context.push("/student/notes/capture"),
        child: const Icon(Icons.add_rounded),
      ),
      body: isEmpty ? _buildEmptyState() : _buildContent(context),
    );
  }

  Widget _buildEmptyState() {
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
                Icons.photo_camera_outlined,
                size: 56,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "No notes yet",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              "Tap + to capture your first grade",
              style: TextStyle(fontSize: 15, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    final currentCycle = _groups.first;
    final totalNotes = currentCycle.notes.length;
    final totalBonusPts = currentCycle.notes.fold<int>(0, (sum, n) => sum + n.bonusPts);

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SummaryChipRow(
              totalNotes: totalNotes,
              totalBonusPts: totalBonusPts,
              netPts: totalBonusPts,
              cycleId: currentCycle.cycleId,
            ),
          ),
        ),
        for (final group in _groups) ...[
          SliverPersistentHeader(
            pinned: true,
            delegate: _SectionHeaderDelegate(group.label),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) {
                final note = group.notes[i];
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: _NoteCard(
                    note: note,
                    onTap: () => context.push("/student/notes/detail/${note.id}"),
                  ),
                );
              },
              childCount: group.notes.length,
            ),
          ),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }
}

class _SummaryChipRow extends StatelessWidget {
  final int totalNotes;
  final int totalBonusPts;
  final int netPts;
  final String cycleId;

  const _SummaryChipRow({
    required this.totalNotes,
    required this.totalBonusPts,
    required this.netPts,
    required this.cycleId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Chip(
                label: "$totalNotes notes",
                icon: Icons.note_alt_outlined,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              _Chip(
                label: "+$totalBonusPts pts",
                icon: Icons.star_outline_rounded,
                color: AppColors.tierBest,
              ),
              const SizedBox(width: 8),
              _Chip(
                label: "Net: $netPts pts",
                icon: Icons.account_balance_wallet_outlined,
                color: netPts >= 0 ? AppColors.tierBest : AppColors.tierBelow,
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.push("/student/notes/cycle/$cycleId"),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                "View Cycle Summary",
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _Chip({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  final _NoteItem note;
  final VoidCallback onTap;

  const _NoteCard({required this.note, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tierColor = AppColors.tierColor(note.tier);
    final tierColorLight = AppColors.tierColorLight(note.tier);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.neutral900.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 6,
              height: 72,
              decoration: BoxDecoration(
                color: tierColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  bottomLeft: Radius.circular(14),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            note.subject,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: AppColors.neutral900,
                            ),
                          ),
                          const SizedBox(height: 4),
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: tierColorLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            "Grade ${note.grade}",
                            style: TextStyle(
                              color: tierColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "+${note.bonusPts} pts",
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.tierBest,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 14),
          ],
        ),
      ),
    );
  }
}

class _SectionHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String title;

  _SectionHeaderDelegate(this.title);

  @override
  double get minExtent => 44;

  @override
  double get maxExtent => 44;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: AppColors.neutral50,
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.neutral600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _SectionHeaderDelegate oldDelegate) =>
      title != oldDelegate.title;
}
