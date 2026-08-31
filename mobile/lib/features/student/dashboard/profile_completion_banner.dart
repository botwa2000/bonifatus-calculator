import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../api/services/profile_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';

final _profileCompletionProvider = FutureProvider.autoDispose<bool>((ref) async {
  final profile = await ref.read(profileServiceProvider).fetchProfile();
  final hasSchool = (profile['schoolName'] as String?)?.isNotEmpty == true;
  final hasGrading = profile['defaultGradingSystemId'] != null;
  return hasSchool && hasGrading;
});

class _BannerDismissedNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void dismiss() => state = true;
}

final profileBannerDismissedProvider =
    NotifierProvider<_BannerDismissedNotifier, bool>(_BannerDismissedNotifier.new);

class ProfileCompletionBanner extends ConsumerWidget {
  const ProfileCompletionBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dismissed = ref.watch(profileBannerDismissedProvider);
    if (dismissed) return const SizedBox.shrink();

    final completionAsync = ref.watch(_profileCompletionProvider);
    return completionAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (e, _) => const SizedBox.shrink(),
      data: (isComplete) {
        if (isComplete) return const SizedBox.shrink();
        return _BannerCard(
          onDismiss: () => ref.read(profileBannerDismissedProvider.notifier).dismiss(),
          onTap: () => context.push('/student/settings'),
        );
      },
    );
  }
}

class _BannerCard extends StatelessWidget {
  final VoidCallback onDismiss;
  final VoidCallback onTap;

  const _BannerCard({required this.onDismiss, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
          child: Row(
            children: [
              const Icon(Icons.school_rounded, color: AppColors.primary, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.profileCompleteBanner,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.profileCompleteBannerBody,
                      style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l10n.profileCompleteAction,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.close_rounded, size: 18, color: cs.onSurface.withValues(alpha: 0.4)),
                onPressed: onDismiss,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
