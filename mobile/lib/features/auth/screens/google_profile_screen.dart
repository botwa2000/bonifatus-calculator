import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

class GoogleProfileScreen extends ConsumerStatefulWidget {
  final String idToken;
  final String name;
  final String email;

  const GoogleProfileScreen({
    super.key,
    required this.idToken,
    required this.name,
    required this.email,
  });

  @override
  ConsumerState<GoogleProfileScreen> createState() => _GoogleProfileScreenState();
}

class _GoogleProfileScreenState extends ConsumerState<GoogleProfileScreen> {
  final _nameCtrl = TextEditingController();
  String? _role;
  DateTime? _dob;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = widget.name;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 10),
      firstDate: DateTime(1920),
      lastDate: DateTime(now.year - 3),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  String _formatDob(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (_role == null) {
      setState(() => _error = l10n.googleProfileRoleRequired);
      return;
    }
    if (_dob == null) {
      setState(() => _error = l10n.registerDateOfBirthRequired);
      return;
    }
    setState(() { _error = null; _isSubmitting = true; });
    try {
      final result = await ref.read(authStateNotifierProvider.notifier).loginWithGoogle(
        idToken: widget.idToken,
        role: _role,
        fullName: _nameCtrl.text.trim(),
        dateOfBirth: _formatDob(_dob!),
      );
      if (!mounted) return;
      if (result is GoogleSignInAuthenticated) {
        // Router will navigate to home automatically via state change
      } else {
        setState(() => _error = 'Account creation failed. Please try again.');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              Center(child: Image.asset('assets/images/logo.png', width: 72, height: 72)),
              const SizedBox(height: 24),
              Text(l10n.googleProfileTitle, style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.onSurface)),
              const SizedBox(height: 8),
              Text(l10n.googleProfileSubtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 8),
              Text(widget.email, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 32),

              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.tierBelowLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error))),
                  ]),
                ),
                const SizedBox(height: 16),
              ],

              TextFormField(
                controller: _nameCtrl,
                decoration: InputDecoration(
                  labelText: l10n.registerStep1Title,
                  prefixIcon: const Icon(Icons.person_outline),
                  filled: true,
                  fillColor: theme.colorScheme.surfaceContainerHighest,
                ),
              ),
              const SizedBox(height: 24),

              Text(l10n.registerStep2Title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: _RoleCard(
                    title: l10n.registerRoleStudentTitle,
                    subtitle: l10n.registerRoleStudentSubtitle,
                    icon: Icons.school_outlined,
                    selected: _role == 'child',
                    onTap: () => setState(() => _role = 'child'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _RoleCard(
                    title: l10n.registerRoleParentTitle,
                    subtitle: l10n.registerRoleParentSubtitle,
                    icon: Icons.family_restroom_outlined,
                    selected: _role == 'parent',
                    onTap: () => setState(() => _role = 'parent'),
                  ),
                ),
              ]),
              const SizedBox(height: 24),

              Text(l10n.registerDateOfBirthLabel, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDob,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: theme.colorScheme.outline.withValues(alpha:0.5)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.calendar_today_outlined, size: 20),
                    const SizedBox(width: 12),
                    Text(
                      _dob != null
                          ? '${_dob!.day.toString().padLeft(2, '0')}.${_dob!.month.toString().padLeft(2, '0')}.${_dob!.year}'
                          : l10n.registerDateOfBirthHint,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: _dob != null ? theme.colorScheme.onSurface : theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(l10n.registerCreateAccountButton),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha:0.08) : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.primary : theme.colorScheme.outline.withValues(alpha:0.3),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: selected ? AppColors.primary : theme.colorScheme.onSurfaceVariant, size: 28),
            const SizedBox(height: 8),
            Text(title, style: theme.textTheme.titleSmall?.copyWith(
              color: selected ? AppColors.primary : theme.colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            )),
            const SizedBox(height: 4),
            Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}
