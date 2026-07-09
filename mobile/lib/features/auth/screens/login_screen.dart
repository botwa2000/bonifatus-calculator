import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../api/services/biometric_service.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _biometricAvailable = false;
  bool _biometricAutoTriggered = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initBiometric();
  }

  Future<void> _initBiometric() async {
    final svc = ref.read(biometricServiceProvider);
    final enabled = await svc.isEnabled();
    if (!enabled) return;
    final canAuth = await svc.canAuthenticate();
    if (!mounted) return;
    setState(() => _biometricAvailable = canAuth);
    if (canAuth && !_biometricAutoTriggered) {
      _biometricAutoTriggered = true;
      _loginWithBiometrics();
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);
    await ref.read(authStateNotifierProvider.notifier).login(
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
  }

  Future<void> _loginWithBiometrics() async {
    setState(() => _error = null);
    final svc = ref.read(biometricServiceProvider);
    final authed = await svc.authenticate();
    if (!authed || !mounted) return;
    await ref.read(authStateNotifierProvider.notifier).loginWithBiometrics();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final isLoading = ref.watch(authStateNotifierProvider).isLoading;

    ref.listen(authStateNotifierProvider, (_, next) {
      next.whenOrNull(
        error: (err, _) => setState(
          () => _error = err.toString().replaceFirst('Exception: ', ''),
        ),
      );
    });

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Center(
                  child: Image.asset('assets/images/logo.png', width: 72, height: 72),
                ),
                const SizedBox(height: 24),
                Text(l10n.loginWelcomeBack, style: theme.textTheme.displayLarge?.copyWith(color: AppColors.neutral900)),
                const SizedBox(height: 8),
                Text(l10n.loginSignInSubtitle, style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
                const SizedBox(height: 40),

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

                AutofillGroup(
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        autofillHints: const [AutofillHints.email, AutofillHints.username],
                        decoration: InputDecoration(labelText: l10n.loginEmailLabel, prefixIcon: const Icon(Icons.email_outlined)),
                        validator: (v) => (v == null || !v.contains('@')) ? l10n.loginEmailValidator : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passCtrl,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        onFieldSubmitted: (_) => _submit(),
                        decoration: InputDecoration(
                          labelText: l10n.loginPasswordLabel,
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                        ),
                        validator: (v) => (v == null || v.isEmpty) ? l10n.loginPasswordValidator : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/auth/forgot-password'),
                    child: Text(l10n.loginForgotPassword),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: isLoading ? null : _submit,
                  child: isLoading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(l10n.loginSignInButton),
                ),

                if (_biometricAvailable) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: isLoading ? null : _loginWithBiometrics,
                    icon: const Icon(Icons.fingerprint_rounded),
                    label: Text(l10n.loginBiometricButton),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],

                const SizedBox(height: 24),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(l10n.loginNoAccountPrompt, style: theme.textTheme.bodyMedium),
                  TextButton(
                    onPressed: () => context.go('/auth/register'),
                    child: Text(l10n.loginSignUpLink),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
