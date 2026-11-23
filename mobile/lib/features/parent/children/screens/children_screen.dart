import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../models/child_data.dart';
import '../../providers/children_provider.dart';
import '../../../../utils/format_utils.dart';
import '../widgets/invite_child_dialog.dart';

enum _TypeFilter { all, notes, reports }
enum _StatusFilter { all, unsettled, settled }

class ChildrenScreen extends ConsumerStatefulWidget {
  const ChildrenScreen({super.key});

  @override
  ConsumerState<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends ConsumerState<ChildrenScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  _TypeFilter _typeFilter = _TypeFilter.all;
  _StatusFilter _statusFilter = _StatusFilter.all;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => _showInviteDialog(context, ref),
        child: const Icon(Icons.qr_code_rounded),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 4, 4),
              child: Row(
                children: [
                  Text(
                    l10n.childrenTitle,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
                    onPressed: () => ref.read(childrenQuickGradesProvider.notifier).reload(),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: l10n.childrenSearchPlaceholder,
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _query = '');
                          },
                        )
                      : null,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  filled: true,
                  fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
            ),
            _FilterBar(
              typeFilter: _typeFilter,
              statusFilter: _statusFilter,
              onTypeChanged: (v) => setState(() => _typeFilter = v),
              onStatusChanged: (v) => setState(() => _statusFilter = v),
              l10n: l10n,
            ),
            Expanded(
              child: childrenAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                error: (err, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(l10n.childrenFailedToLoad, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface)),
                        const SizedBox(height: 8),
                        Text(err.toString(), style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant), textAlign: TextAlign.center),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () => ref.read(childrenQuickGradesProvider.notifier).reload(),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: AppColors.white),
                          child: Text(l10n.childrenRetry),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (children) {
                  if (children.isEmpty) return _buildEmptyState(context, ref, l10n);
                  final filtered = _query.isEmpty
                      ? children
                      : children.where((c) => c.childName.toLowerCase().contains(_query)).toList();
                  if (filtered.isEmpty) {
                    return Center(
                      child: Text(
                        l10n.childrenNoChildrenConnected,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    );
                  }
                  return _buildList(context, ref, filtered, l10n);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
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
            Text(
              l10n.childrenNoChildrenConnected,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.childrenShareQrHint,
              style: TextStyle(fontSize: 15, color: Theme.of(context).colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showInviteDialog(context, ref),
              icon: const Icon(Icons.qr_code_rounded),
              label: Text(l10n.childrenShowInviteQr),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(
      BuildContext context, WidgetRef ref, List<ChildWithGrades> children, AppLocalizations l10n) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
      itemCount: children.length,
      itemBuilder: (ctx, i) {
        final child = children[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _ChildCard(
            child: child,
            l10n: l10n,
            typeFilter: _typeFilter,
            statusFilter: _statusFilter,
            onView: () => context.push('/parent/children/${child.childId}'),
          ),
        );
      },
    );
  }

  void _showInviteDialog(BuildContext context, WidgetRef ref) {
    showInviteChildDialog(context, ref, source: InviteSource.children);
  }
}

class _ChildCard extends StatelessWidget {
  final ChildWithGrades child;
  final VoidCallback onView;
  final AppLocalizations l10n;
  final _TypeFilter typeFilter;
  final _StatusFilter statusFilter;

  const _ChildCard({
    required this.child,
    required this.onView,
    required this.l10n,
    required this.typeFilter,
    required this.statusFilter,
  });

  @override
  Widget build(BuildContext context) {
    var grades = child.grades.toList();
    if (typeFilter == _TypeFilter.notes) grades = grades.where((g) => g.gradeSource == 'notes').toList();
    if (typeFilter == _TypeFilter.reports) grades = grades.where((g) => g.gradeSource == 'calculator').toList();
    if (statusFilter == _StatusFilter.unsettled) grades = grades.where((g) => g.settlementStatus == 'unsettled').toList();
    if (statusFilter == _StatusFilter.settled) grades = grades.where((g) => g.settlementStatus == 'settled').toList();

    final filteredPts = grades.fold(0.0, (s, g) => s + g.bonusPoints);

    final String badgeText;
    final Color badgeBg, badgeFg;
    if (typeFilter == _TypeFilter.all && statusFilter == _StatusFilter.all) {
      final unsettled = child.grades.where((g) => g.settlementStatus == 'unsettled').length;
      badgeText = l10n.childrenUnsettledCount(unsettled);
      badgeBg = unsettled == 0 ? AppColors.tierBestLight : AppColors.tierThirdLight;
      badgeFg = unsettled == 0 ? AppColors.tierBest : AppColors.tierThird;
    } else if (statusFilter == _StatusFilter.settled) {
      badgeText = '${grades.length} ${l10n.filterSettled.toLowerCase()}';
      badgeBg = AppColors.tierBestLight;
      badgeFg = AppColors.tierBest;
    } else if (statusFilter == _StatusFilter.unsettled) {
      badgeText = l10n.childrenUnsettledCount(grades.length);
      badgeBg = grades.isEmpty ? AppColors.tierBestLight : AppColors.tierThirdLight;
      badgeFg = grades.isEmpty ? AppColors.tierBest : AppColors.tierThird;
    } else {
      badgeText = '${grades.length} ${l10n.filterAll.toLowerCase()}';
      badgeBg = Theme.of(context).colorScheme.surfaceContainerHighest;
      badgeFg = Theme.of(context).colorScheme.onSurfaceVariant;
    }

    final cs = Theme.of(context).colorScheme;
    final schoolLine = [child.schoolName, child.schoolTown]
        .whereType<String>()
        .where((s) => s.isNotEmpty)
        .join(' · ');

    return Material(
      color: cs.surface,
      borderRadius: BorderRadius.circular(16),
      elevation: 2,
      shadowColor: cs.shadow.withValues(alpha: 0.08),
      child: InkWell(
        onTap: onView,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
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
                  child.childName.substring(0, 1).toUpperCase(),
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
                      child.childName,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    if (schoolLine.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        schoolLine,
                        style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: badgeBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: badgeFg),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          l10n.childrenPtsPending(ptsPrecise(filteredPts)),
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: onView,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    l10n.childrenView,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final _TypeFilter typeFilter;
  final _StatusFilter statusFilter;
  final ValueChanged<_TypeFilter> onTypeChanged;
  final ValueChanged<_StatusFilter> onStatusChanged;
  final AppLocalizations l10n;

  const _FilterBar({
    required this.typeFilter,
    required this.statusFilter,
    required this.onTypeChanged,
    required this.onStatusChanged,
    required this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              Text(l10n.filterGradeType,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
              const SizedBox(width: 8),
              _chip(l10n.filterAll, typeFilter == _TypeFilter.all, () => onTypeChanged(_TypeFilter.all)),
              const SizedBox(width: 6),
              _chip(l10n.filterNotes, typeFilter == _TypeFilter.notes, () => onTypeChanged(_TypeFilter.notes)),
              const SizedBox(width: 6),
              _chip(l10n.filterTestReports, typeFilter == _TypeFilter.reports, () => onTypeChanged(_TypeFilter.reports)),
            ]),
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              Text(l10n.filterStatusLabel,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
              const SizedBox(width: 8),
              _chip(l10n.filterAll, statusFilter == _StatusFilter.all, () => onStatusChanged(_StatusFilter.all)),
              const SizedBox(width: 6),
              _chip(l10n.filterUnsettled, statusFilter == _StatusFilter.unsettled, () => onStatusChanged(_StatusFilter.unsettled)),
              const SizedBox(width: 6),
              _chip(l10n.filterSettled, statusFilter == _StatusFilter.settled, () => onStatusChanged(_StatusFilter.settled)),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.3),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.white : AppColors.primary,
          ),
        ),
      ),
    );
  }
}
