import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../models/invite_code.dart';
import '../../../../models/child_data.dart';
import '../../providers/children_provider.dart';

class ChildrenScreen extends ConsumerWidget {
  const ChildrenScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childrenAsync = ref.watch(childrenQuickGradesProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'Children',
          style: TextStyle(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () =>
                ref.read(childrenQuickGradesProvider.notifier).reload(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        onPressed: () => _showInviteDialog(context, ref),
        child: const Icon(Icons.qr_code_rounded),
      ),
      body: childrenAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline,
                    size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                const Text(
                  'Failed to load children',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.neutral900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(err.toString(),
                    style:
                        const TextStyle(fontSize: 13, color: AppColors.neutral600),
                    textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () =>
                      ref.read(childrenQuickGradesProvider.notifier).reload(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                  ),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (children) {
          if (children.isEmpty) {
            return _buildEmptyState(context, ref);
          }
          return _buildList(context, children);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, WidgetRef ref) {
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
            const Text(
              'No children connected',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Share an invite QR code to connect with a student',
              style: TextStyle(fontSize: 15, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showInviteDialog(context, ref),
              icon: const Icon(Icons.qr_code_rounded),
              label: const Text('Show Invite QR'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context, List<ChildWithGrades> children) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: children.length,
      itemBuilder: (ctx, i) {
        final child = children[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _ChildCard(
            child: child,
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
      final service =
          widget.ref.read(connectionServiceProvider);
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
            const Text(
              'Invite a Student',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Ask the student to scan this code in their app',
              style: TextStyle(fontSize: 13, color: AppColors.neutral600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            if (_loading)
              const SizedBox(
                height: 200,
                child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary)),
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
                      Text(
                        'Failed to create invite',
                        style: const TextStyle(color: AppColors.error),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _loading = true;
                            _error = null;
                          });
                          _loadInvite();
                        },
                        child: const Text('Retry'),
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
              // Code display
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.neutral100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(
                      'Code: ${_invite!.code}',
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
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.neutral600,
                      ),
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
                child: const Text('Close'),
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

  const _ChildCard({required this.child, required this.onView});

  @override
  Widget build(BuildContext context) {
    final tier = child.latestTier;
    final tierColor = AppColors.tierColor(tier);
    final tierColorLight = AppColors.tierColorLight(tier);
    final pendingPts = child.totalPendingPoints;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
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
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral900,
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
                        '${child.grades.length} grades',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: tierColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$pendingPts pts pending',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.neutral600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onView,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryLight,
              foregroundColor: AppColors.primary,
              elevation: 0,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text(
              'View',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
