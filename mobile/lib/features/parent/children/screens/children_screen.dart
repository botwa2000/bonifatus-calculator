import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../models/invite_code.dart';
import '../../../../models/child_data.dart';
import '../../providers/children_provider.dart';
import '../../../../utils/format_utils.dart';

class ChildrenScreen extends ConsumerStatefulWidget {
  const ChildrenScreen({super.key});

  @override
  ConsumerState<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends ConsumerState<ChildrenScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

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
            onView: () => context.push('/parent/children/${child.childId}'),
          ),
        );
      },
    );
  }

  void _showInviteDialog(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (ctx) => _InviteDialog(ref: ref),
    );
  }
}

class _InviteDialog extends StatefulWidget {
  final WidgetRef ref;
  const _InviteDialog({required this.ref});

  @override
  State<_InviteDialog> createState() => _InviteDialogState();
}

class _InviteDialogState extends State<_InviteDialog> {
  InviteCode? _invite;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvite();
  }

  Future<void> _loadInvite() async {
    try {
      final service = widget.ref.read(connectionServiceProvider);
      final invite = await service.createInvite();
      if (mounted) {
        setState(() {
          _invite = invite;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final inviteUrl = _invite != null
        ? 'https://bonifatus.com/invite?code=${_invite!.code}'
        : null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.childrenInviteStudent,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.childrenScanCodeHint,
              style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            if (_loading)
              const SizedBox(
                height: 200,
                child: Center(
                    child:
                        CircularProgressIndicator(color: AppColors.primary)),
              )
            else if (_error != null)
              SizedBox(
                height: 120,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.error, size: 32),
                      const SizedBox(height: 8),
                      Text(l10n.childrenFailedToCreateInvite,
                          style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _loading = true;
                            _error = null;
                          });
                          _loadInvite();
                        },
                        child: Text(l10n.childrenRetry),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              QrImageView(
                data: inviteUrl!,
                size: 200,
                backgroundColor: Colors.white,
              ),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(
                      AppLocalizations.of(context)!.childrenInviteCode(_invite!.code),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        letterSpacing: 6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      inviteUrl,
                      style: TextStyle(
                          fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(l10n.childrenClose),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChildCard extends StatelessWidget {
  final ChildWithGrades child;
  final VoidCallback onView;
  final AppLocalizations l10n;

  const _ChildCard({required this.child, required this.onView, required this.l10n});

  @override
  Widget build(BuildContext context) {
    final tier = child.latestTier;
    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);
    final pendingPts = child.totalPendingPoints;

    final cs = Theme.of(context).colorScheme;
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
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: tierColorLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            l10n.childrenGradesCount(child.grades.where((g) => g.gradeSource == 'notes').length),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: tierColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          l10n.childrenPtsPending(ptsPrecise(pendingPts)),
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
