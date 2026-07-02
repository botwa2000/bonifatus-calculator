import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    if (_passCtrl.text.length < 12) {
      setState(() => _error = 'Password must be at least 12 characters');
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
        'dateOfBirth': '2000-01-01',
      });
      final userId = (resp.data as Map?)?['userId'] as String? ?? '';
      if (mounted) {
        context.go('/auth/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}&userId=${Uri.encodeComponent(userId)}&purpose=email_verification');
      }
    } catch (e) {
      String msg = 'Registration failed. Please try again.';
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
    return Scaffold(
      backgroundColor: AppColors.white,
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
                    backgroundColor: AppColors.neutral200,
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
                  _Step1(ctrl: _nameCtrl, onNext: _nextStep),
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
                Text('Already have an account? ', style: theme.textTheme.bodyMedium),
                TextButton(onPressed: () => context.go('/auth/login'), child: const Text('Sign in')),
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
  final VoidCallback onNext;
  const _Step1({required this.ctrl, required this.onNext});
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
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text('What is your name?', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text('This is how you will appear to others.', style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
        const SizedBox(height: 32),
        TextFormField(
          controller: widget.ctrl,
          textInputAction: TextInputAction.done,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Full name', prefixIcon: Icon(Icons.person_outline)),
          onFieldSubmitted: (_) => widget.onNext(),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: widget.ctrl.text.trim().isEmpty ? null : widget.onNext,
          child: const Text('Continue'),
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
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text('I am a...', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text('Choose your role to get the right experience.', style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
        const SizedBox(height: 32),
        _RoleCard(title: 'Student', subtitle: 'Track my grades and earn rewards', icon: Icons.school_outlined,
          selected: role == 'child', onTap: () => onChanged('child')),
        const SizedBox(height: 12),
        _RoleCard(title: 'Parent', subtitle: 'Set rewards and monitor my child progress', icon: Icons.family_restroom,
          selected: role == 'parent', onTap: () => onChanged('parent')),
        const Spacer(),
        ElevatedButton(onPressed: onNext, child: const Text('Continue')),
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
            color: selected ? AppColors.primary : AppColors.neutral200,
            width: selected ? 2 : 1,
          ),
          color: selected ? AppColors.primaryLight : AppColors.white,
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.neutral100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: selected ? AppColors.white : AppColors.neutral600, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? AppColors.primary : AppColors.neutral900)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.neutral600)),
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 24),
        Text('Create your account', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text('Almost there!', style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
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
        TextFormField(
          controller: emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: passCtrl,
          obscureText: obscure,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'Password',
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
          onFieldSubmitted: (_) => onNext(),
          decoration: const InputDecoration(labelText: 'Confirm password', prefixIcon: Icon(Icons.lock_outline)),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: isLoading ? null : onNext,
          child: isLoading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Create Account'),
        ),
      ]),
    );
  }
}
