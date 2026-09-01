import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../api/services/profile_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';

class _ProfileStatus {
  final bool hasName;
  final bool hasBirthday;
  final bool hasSchool;
  final bool hasGrading;

  const _ProfileStatus({
    required this.hasName,
    required this.hasBirthday,
    required this.hasSchool,
    required this.hasGrading,
  });

  bool get isComplete => hasName && hasBirthday && hasSchool && hasGrading;

  int get completedCount =>
      [hasName, hasBirthday, hasSchool, hasGrading].where((b) => b).length;
}

final _profileStatusProvider = FutureProvider.autoDispose<_ProfileStatus>((ref) async {
  final profile = await ref.read(profileServiceProvider).fetchProfile();
  return _ProfileStatus(
    hasName: ((profile['fullName'] as String?) ?? '').isNotEmpty,
    hasBirthday: ((profile['dateOfBirth'] as String?) ?? '').isNotEmpty,
    hasSchool: ((profile['schoolName'] as String?) ?? '').isNotEmpty,
    hasGrading: profile['defaultGradingSystemId'] != null,
  );
});

class ProfileCompletionBanner extends ConsumerWidget {
  const ProfileCompletionBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(_profileStatusProvider);
    return statusAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (status) {
        if (status.isComplete) return const SizedBox.shrink();
        return _ChecklistCard(status: status);
      },
    );
  }
}

class _ChecklistCard extends StatelessWidget {
  final _ProfileStatus status;
  const _ChecklistCard({required this.status});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final total = 4;
    final completed = status.completedCount;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outlineVariant),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(
                    l10n.profileCompleteBanner,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    l10n.profileSetupCount(completed, total),
                    style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                ]),
              ),
            ]),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: completed / total,
                minHeight: 4,
                backgroundColor: cs.outlineVariant,
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            _ChecklistItem(done: status.hasName, label: l10n.profileSetupItemName),
            _ChecklistItem(done: status.hasBirthday, label: l10n.profileSetupItemBirthday),
            _ChecklistItem(done: status.hasSchool, label: l10n.profileSetupItemSchool),
            _ChecklistItem(done: status.hasGrading, label: l10n.profileSetupItemGrading, isLast: true),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => context.push('/student/settings'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(l10n.profileCompleteAction,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChecklistItem extends StatelessWidget {
  final bool done;
  final String label;
  final bool isLast;

  const _ChecklistItem({required this.done, required this.label, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 7),
          child: Row(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: done ? AppColors.tierBest : Colors.transparent,
                border: Border.all(
                  color: done ? AppColors.tierBest : const Color(0xFFD97706),
                  width: 1.5,
                ),
              ),
              child: done
                  ? const Icon(Icons.check, size: 11, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: done ? cs.onSurfaceVariant : cs.onSurface,
                  decoration: done ? TextDecoration.lineThrough : null,
                  decorationColor: cs.onSurfaceVariant,
                ),
              ),
            ),
            if (!done)
              Icon(Icons.chevron_right_rounded, size: 18, color: cs.outlineVariant),
          ]),
        ),
        if (!isLast)
          Divider(height: 1, color: cs.outlineVariant),
      ],
    );
  }
}
