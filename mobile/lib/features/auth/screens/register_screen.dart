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

  // Step 1
  final _nameCtrl = TextEditingController();
  DateTime? _selectedBirthDate;
  // Step 2
  String _role = 'child';
  // Step 3
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;

  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _pageCtrl.dispose(); _nameCtrl.dispose();
    _emailCtrl.dispose(); _passCtrl.dispose(); _confirmCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step < 2) {
      _pageCtrl.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submit();
    }
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (_selectedBirthDate == null) {
      setState(() => _error = l10n.registerDateOfBirthRequired);
      return;
    }
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
        'fullName': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'role': _role,
        'dateOfBirth': '${_selectedBirthDate!.year.toString().padLeft(4, '0')}-${_selectedBirthDate!.month.toString().padLeft(2, '0')}-${_selectedBirthDate!.day.toString().padLeft(2, '0')}',
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
                    value: (_step + 1) / 3,
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
                  _Step1(ctrl: _nameCtrl, selectedDate: _selectedBirthDate, onDateChanged: (d) => setState(() => _selectedBirthDate = d), onNext: _nextStep),
                  _Step2(role: _role, onChanged: (r) => setState(() => _role = r), onNext: _nextStep),
                  _Step3(
                    emailCtrl: _emailCtrl, passCtrl: _passCtrl, confirmCtrl: _confirmCtrl,
                    obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure),
                    error: _error, isLoading: _isLoading, onNext: _nextStep,
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

class _Step1 extends StatefulWidget {
  final TextEditingController ctrl;
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateChanged;
  final VoidCallback onNext;
  const _Step1({required this.ctrl, this.selectedDate, required this.onDateChanged, required this.onNext});
  @override
  State<_Step1> createState() => _Step1State();
}

class _Step1State extends State<_Step1> {
  @override
  void initState() {
    super.initState();
    widget.ctrl.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.ctrl.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text(l10n.registerStep1Title, style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(l10n.registerStep1Subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 32),
        TextFormField(
          controller: widget.ctrl,
          textInputAction: TextInputAction.done,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(labelText: l10n.registerFullNameLabel, prefixIcon: const Icon(Icons.person_outline)),
          onFieldSubmitted: (_) => widget.onNext(),
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap: () async {
            final now = DateTime.now();
            final initial = widget.selectedDate ?? DateTime(now.year - 10, now.month, now.day);
            final picked = await showDatePicker(
              context: context,
              initialDate: initial,
              firstDate: DateTime(1940),
              lastDate: DateTime(now.year - 4, now.month, now.day),
            );
            if (picked != null) widget.onDateChanged(picked);
          },
          borderRadius: BorderRadius.circular(12),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: l10n.registerDateOfBirthLabel,
              prefixIcon: const Icon(Icons.cake_outlined),
            ),
            child: Text(
              widget.selectedDate != null
                  ? '${widget.selectedDate!.day.toString().padLeft(2, '0')}.${widget.selectedDate!.month.toString().padLeft(2, '0')}.${widget.selectedDate!.year}'
                  : l10n.registerDateOfBirthHint,
              style: TextStyle(
                color: widget.selectedDate != null
                    ? Theme.of(context).colorScheme.onSurface
                    : Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 15,
              ),
            ),
          ),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: widget.ctrl.text.trim().isEmpty || widget.selectedDate == null ? null : widget.onNext,
          child: Text(l10n.registerContinueButton),
        ),
      ]),
    );
  }
}

class _Step2 extends StatelessWidget {
  final String role;
  final ValueChanged<String> onChanged;
  final VoidCallback onNext;
  const _Step2({required this.role, required this.onChanged, required this.onNext});
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
        _RoleCard(title: l10n.registerRoleStudentTitle, subtitle: l10n.registerRoleStudentSubtitle, icon: Icons.school_outlined,
          selected: role == 'child', onTap: () => onChanged('child')),
        const SizedBox(height: 12),
        _RoleCard(title: l10n.registerRoleParentTitle, subtitle: l10n.registerRoleParentSubtitle, icon: Icons.family_restroom,
          selected: role == 'parent', onTap: () => onChanged('parent')),
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

class _Step3 extends StatelessWidget {
  final TextEditingController emailCtrl, passCtrl, confirmCtrl;
  final bool obscure, isLoading;
  final String? error;
  final VoidCallback onToggle, onNext;
  const _Step3({required this.emailCtrl, required this.passCtrl, required this.confirmCtrl,
    required this.obscure, required this.isLoading, this.error, required this.onToggle, required this.onNext});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text(l10n.registerStep3Title, style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(l10n.registerStep3Subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 32),
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
      ]),
    );
  }
}
