import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../api/client.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _pageCtrl = PageController();
  int _step = 0;

  String _role = 'child';

  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;

  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _pageCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step < 1) {
      _pageCtrl.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submit();
    }
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _error = l10n.registerPasswordsDoNotMatch);
      return;
    }
    if (_passCtrl.text.length < 12) {
      setState(() => _error = l10n.registerPasswordTooShort);
      return;
    }
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      final resp = await client.post('/api/auth/register', data: {
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'role': _role,
      });
      final userId = (resp.data as Map?)?['userId'] as String? ?? '';
      if (mounted) {
        context.go('/auth/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}&userId=${Uri.encodeComponent(userId)}&purpose=email_verification');
      }
    } catch (e) {
      String msg = l10n.registerFailed;
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['error'] != null) {
          msg = data['error'].toString();
        } else if (data is Map && data['message'] != null) {
          msg = data['message'].toString();
        }
      }
      setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(children: [
                if (_step > 0)
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => _pageCtrl.previousPage(
                      duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                  )
                else
                  const SizedBox(width: 48),
                Expanded(
                  child: LinearProgressIndicator(
                    value: (_step + 1) / 2,
                    backgroundColor: Theme.of(context).colorScheme.outlineVariant,
                    valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                    borderRadius: BorderRadius.circular(4),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(width: 48),
              ]),
            ),
            Expanded(
              child: PageView(
                controller: _pageCtrl,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (i) => setState(() => _step = i),
                children: [
                  _StepRole(role: _role, onChanged: (r) => setState(() => _role = r), onNext: _nextStep),
                  _StepCredentials(
                    emailCtrl: _emailCtrl,
                    passCtrl: _passCtrl,
                    confirmCtrl: _confirmCtrl,
                    role: _role,
                    obscure: _obscure,
                    onToggle: () => setState(() => _obscure = !_obscure),
                    error: _error,
                    isLoading: _isLoading,
                    onNext: _nextStep,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(l10n.registerAlreadyHaveAccount, style: theme.textTheme.bodyMedium),
                TextButton(onPressed: () => context.go('/auth/login'), child: Text(l10n.registerSignInLink)),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepRole extends StatelessWidget {
  final String role;
  final ValueChanged<String> onChanged;
  final VoidCallback onNext;
  const _StepRole({required this.role, required this.onChanged, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text(l10n.registerStep2Title, style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(l10n.registerStep2Subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 32),
        _RoleCard(
          title: l10n.registerRoleStudentTitle,
          subtitle: l10n.registerRoleStudentSubtitle,
          icon: Icons.school_outlined,
          selected: role == 'child',
          onTap: () => onChanged('child'),
        ),
        const SizedBox(height: 12),
        _RoleCard(
          title: l10n.registerRoleParentTitle,
          subtitle: l10n.registerRoleParentSubtitle,
          icon: Icons.family_restroom,
          selected: role == 'parent',
          onTap: () => onChanged('parent'),
        ),
        const Spacer(),
        ElevatedButton(onPressed: onNext, child: Text(l10n.registerContinueButton)),
      ]),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title, subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _RoleCard({required this.title, required this.subtitle, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.primary : Theme.of(context).colorScheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
          color: selected ? AppColors.primaryLight : Theme.of(context).colorScheme.surface,
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: selected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? AppColors.primary : Theme.of(context).colorScheme.onSurface)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ])),
          if (selected) const Icon(Icons.check_circle, color: AppColors.primary),
        ]),
      ),
    );
  }
}

class _StepCredentials extends StatelessWidget {
  final TextEditingController emailCtrl, passCtrl, confirmCtrl;
  final String role;
  final bool obscure, isLoading;
  final String? error;
  final VoidCallback onToggle, onNext;

  const _StepCredentials({
    required this.emailCtrl,
    required this.passCtrl,
    required this.confirmCtrl,
    required this.role,
    required this.obscure,
    required this.isLoading,
    this.error,
    required this.onToggle,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final isStudent = role == 'child';
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text(l10n.registerStep3Title, style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(l10n.registerStep3Subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(isStudent ? Icons.school_outlined : Icons.family_restroom, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              isStudent ? l10n.registerRoleStudentTitle : l10n.registerRoleParentTitle,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary),
            ),
          ]),
        ),
        const SizedBox(height: 24),
        if (error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.tierBelowLight, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(error!, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error))),
            ]),
          ),
          const SizedBox(height: 16),
        ],
        AutofillGroup(
          child: Column(children: [
            TextFormField(
              controller: emailCtrl,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email],
              decoration: InputDecoration(labelText: l10n.registerEmailLabel, prefixIcon: const Icon(Icons.email_outlined)),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: passCtrl,
              obscureText: obscure,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.newPassword],
              decoration: InputDecoration(
                labelText: l10n.registerPasswordLabel,
                helperText: l10n.registerPasswordHelper,
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  onPressed: onToggle),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: confirmCtrl,
              obscureText: obscure,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.newPassword],
              onFieldSubmitted: (_) => onNext(),
              decoration: InputDecoration(labelText: l10n.registerConfirmPasswordLabel, prefixIcon: const Icon(Icons.lock_outline)),
            ),
          ]),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: isLoading ? null : onNext,
          child: isLoading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(l10n.registerCreateAccountButton),
        ),
        const SizedBox(height: 12),
        Text(
          l10n.registerTermsHint,
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
      ]),
    );
  }
}
