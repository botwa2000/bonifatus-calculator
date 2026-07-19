import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/children_provider.dart';
import '../../../../models/settlement_package.dart';
import '../../../../api/services/grade_service.dart';

class SettleScreen extends ConsumerStatefulWidget {
  const SettleScreen({super.key});

  @override
  ConsumerState<SettleScreen> createState() => _SettleScreenState();
}

class _SettleScreenState extends ConsumerState<SettleScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _typeFilter = 'all';
  String? _childFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        elevation: 0,
        title: Text(
          l10n.settleTitle,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 20),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: () => _showPeriodSheet(context),
            tooltip: l10n.settlePeriodLabel,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: cs.onSurfaceVariant,
          indicatorColor: AppColors.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600),
          tabs: [
            Tab(text: l10n.settleTabPending),
            Tab(text: l10n.settleTabHistory),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _PendingTab(
            typeFilter: _typeFilter,
            childFilter: _childFilter,
            onTypeFilterChanged: (f) => setState(() => _typeFilter = f),
            onChildFilterChanged: (id) => setState(() => _childFilter = id),
          ),
          const _HistoryTab(),
        ],
      ),
    );
  }

  void _showPeriodSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final periodAsync = ref.read(settlementPeriodUnitProvider);
    final currentUnit = periodAsync.valueOrNull ?? 'monthly';

    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        String selected = currentUnit;
        return StatefulBuilder(builder: (ctx, setSheet) {
          final cs = Theme.of(ctx).colorScheme;
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 40, height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                          color: cs.outlineVariant,
                          borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  Text(l10n.settlePeriodLabel,
                      style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface)),
                  const SizedBox(height: 16),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(value: 'weekly', label: Text(l10n.settlePeriodWeekly)),
                      ButtonSegment(value: 'monthly', label: Text(l10n.settlePeriodMonthly)),
                      ButtonSegment(value: 'quarterly', label: Text(l10n.settlePeriodQuarterly)),
                    ],
                    selected: {selected},
                    onSelectionChanged: (s) => setSheet(() => selected = s.first),
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      textStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.of(ctx).pop();
                        try {
                          await ref
                              .read(settlementPeriodUnitProvider.notifier)
                              .setUnit(selected);
                          ref.invalidate(settlementPackagesProvider);
                        } catch (_) {}
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(l10n.settleConfirmButton,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }
}

// ── Pending Tab ──────────────────────────────────────────────────────────────

class _PendingTab extends ConsumerWidget {
  final String typeFilter;
  final String? childFilter;
  final ValueChanged<String> onTypeFilterChanged;
  final ValueChanged<String?> onChildFilterChanged;

  const _PendingTab({
    required this.typeFilter,
    required this.childFilter,
    required this.onTypeFilterChanged,
    required this.onChildFilterChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final packagesAsync = ref.watch(settlementPackagesProvider);

    return packagesAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(l10n.settleLoadError,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => ref.invalidate(settlementPackagesProvider),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white),
                child: Text(l10n.settleRetry),
              ),
            ],
          ),
        ),
      ),
      data: (packages) {
        // Build unique children list from packages
        final childIds = <String>{};
        final childNames = <String, String>{};
        for (final p in packages) {
          childIds.add(p.childId);
          childNames[p.childId] = p.childName;
        }
        final children = childIds.map((id) => (id: id, name: childNames[id]!)).toList()
          ..sort((a, b) => a.name.compareTo(b.name));

        // Apply filters
        var filtered = packages.where((p) {
          if (typeFilter == 'report_card' && !p.isReportCard) return false;
          if (typeFilter == 'grade_period' && !p.isGradePeriod) return false;
          if (childFilter != null && p.childId != childFilter) return false;
          return true;
        }).toList();

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(settlementPackagesProvider),
          child: CustomScrollView(
            slivers: [
              // Child filter chips (only when multiple children)
              if (children.length > 1)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 44,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _filterChip(
                            context,
                            label: l10n.settleFilterAll,
                            selected: childFilter == null,
                            onSelected: () => onChildFilterChanged(null),
                          ),
                        ),
                        for (final c in children)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _filterChip(
                              context,
                              label: c.name,
                              selected: childFilter == c.id,
                              onSelected: () => onChildFilterChanged(c.id),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

              // Type filter chips
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _filterChip(
                          context,
                          label: l10n.settleFilterAll,
                          selected: typeFilter == 'all',
                          onSelected: () => onTypeFilterChanged('all'),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _filterChip(
                          context,
                          label: l10n.settleFilterReportCards,
                          selected: typeFilter == 'report_card',
                          onSelected: () =>
                              onTypeFilterChanged('report_card'),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _filterChip(
                          context,
                          label: l10n.settleFilterPeriods,
                          selected: typeFilter == 'grade_period',
                          onSelected: () =>
                              onTypeFilterChanged('grade_period'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              if (filtered.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Text(
                      l10n.settleNoPackages,
                      style: TextStyle(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurfaceVariant),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _PackageCard(package: filtered[i]),
                      ),
                      childCount: filtered.length,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _filterChip(BuildContext context,
      {required String label,
      required bool selected,
      required VoidCallback onSelected}) {
    final cs = Theme.of(context).colorScheme;
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: AppColors.primary.withValues(alpha: 0.15),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        fontWeight: FontWeight.w600,
        color: selected ? AppColors.primary : cs.onSurfaceVariant,
      ),
      side: BorderSide(
        color: selected ? AppColors.primary : cs.outlineVariant,
      ),
    );
  }
}

// ── Package Card ─────────────────────────────────────────────────────────────

class _PackageCard extends ConsumerStatefulWidget {
  final SettlementPackage package;
  const _PackageCard({required this.package});

  @override
  ConsumerState<_PackageCard> createState() => _PackageCardState();
}

class _PackageCardState extends ConsumerState<_PackageCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final pkg = widget.package;

    final badgeLabel =
        pkg.isReportCard ? l10n.settleReportCardBadge : l10n.settleGradePeriodBadge;
    final badgeColor = pkg.isReportCard ? AppColors.primary : AppColors.tierSecond;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(16)),
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badgeLabel,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: badgeColor,
                          ),
                        ),
                      ),
                      if (pkg.isOngoing) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.tierBestLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            l10n.settleOngoingBadge,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.tierBest,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        '+${pkg.totalPoints} ${l10n.ptsAbbr}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.tierBest,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        _expanded
                            ? Icons.expand_less_rounded
                            : Icons.expand_more_rounded,
                        color: cs.onSurfaceVariant,
                        size: 20,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Child avatar
                      Container(
                        width: 26,
                        height: 26,
                        decoration: const BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle),
                        alignment: Alignment.center,
                        child: Text(
                          pkg.childName.substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              pkg.childName,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: cs.onSurface,
                              ),
                            ),
                            Text(
                              _packageSubtitle(l10n, pkg),
                              style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        l10n.settlePackageItems(pkg.itemCount),
                        style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Expanded items
          if (_expanded) ...[
            Divider(height: 1, color: cs.outlineVariant),
            ...pkg.items.map((item) => _ItemRow(item: item)),
            Divider(height: 1, color: cs.outlineVariant),
          ],

          // Settle button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showConfirmSheet(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(
                  l10n.settlePackageButton,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _packageSubtitle(AppLocalizations l10n, SettlementPackage pkg) {
    if (pkg.isReportCard) {
      final parts = <String>[];
      if (pkg.schoolYear != null) {
        parts.add(l10n.settleSchoolYear(pkg.schoolYear!));
      }
      if (pkg.classLevel != null) {
        parts.add(l10n.settleClassLevel(pkg.classLevel!));
      }
      return parts.join(' · ');
    } else {
      return pkg.label;
    }
  }

  void _showConfirmSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final pkg = widget.package;
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        bool settling = false;
        return StatefulBuilder(builder: (ctx, setSheet) {
          final cs = Theme.of(ctx).colorScheme;
          return Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.settleConfirmTitle,
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface),
                ),
                const SizedBox(height: 6),
                Text(
                  pkg.label,
                  style:
                      TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
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
                      Text(
                        l10n.settleConfirmBody(pkg.totalPoints, pkg.childName),
                        style: TextStyle(
                            color: cs.onSurface, fontWeight: FontWeight.w500),
                      ),
                      Text(
                        '+${pkg.totalPoints} ${l10n.ptsAbbr}',
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
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: settling
                          ? null
                          : () => Navigator.of(ctx).pop(),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: cs.outlineVariant),
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(l10n.rewardsCancel,
                          style: TextStyle(color: cs.onSurface)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: settling
                          ? null
                          : () async {
                              setSheet(() => settling = true);
                              try {
                                await ref
                                    .read(gradeServiceProvider)
                                    .createSettlement(
                                  childId: pkg.childId,
                                  amount: pkg.totalPoints,
                                  quickGradeIds: pkg.quickGradeIds,
                                  subjectGradeIds: pkg.subjectGradeIds,
                                  packageType: pkg.type,
                                  packageLabel: pkg.label,
                                );
                                if (ctx.mounted) Navigator.of(ctx).pop();
                                ref.invalidate(settlementPackagesProvider);
                                ref.invalidate(settlementsProvider);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context)
                                      .showSnackBar(SnackBar(
                                    content:
                                        Text(l10n.settleSuccess),
                                    backgroundColor: AppColors.tierBest,
                                  ));
                                }
                              } catch (e) {
                                setSheet(() => settling = false);
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          AppLocalizations.of(ctx)!
                                              .genericFailedError(
                                                  e.toString())),
                                      backgroundColor: AppColors.error,
                                    ),
                                  );
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: settling
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : Text(l10n.settleConfirmButton,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700)),
                    ),
                  ),
                ]),
              ],
            ),
          );
        });
      },
    );
  }
}

class _ItemRow extends StatelessWidget {
  final SettlementPackageItem item;
  const _ItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final tierColor = AppColors.tierColor(item.gradeQualityTier ?? 'below');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
      child: Row(
        children: [
          Container(
            width: 6, height: 6,
            decoration: BoxDecoration(color: tierColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.subjectName ?? l10n.subjectFallback,
              style: TextStyle(fontSize: 14, color: cs.onSurface),
            ),
          ),
          if (item.gradeValue != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: tierColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Text(
                '${l10n.calculatorGradeLabel} ${item.gradeValue}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: tierColor,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Text(
            '+${item.bonusPoints} ${l10n.ptsAbbr}',
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

// ── History Tab ──────────────────────────────────────────────────────────────

class _HistoryTab extends ConsumerWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final settlementsAsync = ref.watch(settlementsProvider);

    return settlementsAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(l10n.settleLoadError,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => ref.invalidate(settlementsProvider),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white),
                child: Text(l10n.settleRetry),
              ),
            ],
          ),
        ),
      ),
      data: (settlements) {
        if (settlements.isEmpty) {
          return Center(
            child: Text(l10n.rewardsHistoryEmpty,
                style: TextStyle(color: cs.onSurfaceVariant)),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: settlements.length,
          itemBuilder: (ctx, i) {
            final s = settlements[i];
            final dateStr =
                DateFormat('MMM d, yyyy').format(s.createdAt.toLocal());
            final hasPackageLabel =
                s.packageLabel != null && s.packageLabel!.isNotEmpty;

            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              clipBehavior: Clip.antiAlias,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                          color: AppColors.primaryLight,
                          shape: BoxShape.circle),
                      alignment: Alignment.center,
                      child: Text(
                        (s.childName ?? '?').substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.childName ?? l10n.nameUnknown,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: cs.onSurface,
                            ),
                          ),
                          const SizedBox(height: 2),
                          if (hasPackageLabel)
                            Text(
                              s.packageLabel!,
                              style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurface,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          Text(
                            dateStr,
                            style: TextStyle(
                              fontSize: 12,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                          color: AppColors.tierBestLight,
                          borderRadius: BorderRadius.circular(20)),
                      child: Text(
                        '+${s.amount} ${l10n.ptsAbbr}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.tierBest,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
