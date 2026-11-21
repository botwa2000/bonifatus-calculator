import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../api/services/biometric_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/social_sign_in_buttons.dart';

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
  bool _isSubmitting = false;
  bool _socialBusy = false;
  bool _biometricAvailable = false;
  String? _error;
  /// Shown under a rejected email + password: the same next steps for everyone, because
  /// the app is never told whether the account exists or was made with Google or Apple.
  bool _showSignInHelp = false;
  /// Set while code entry is open for an unconfirmed sign-in, so the second error
  /// report (listener + post-await check) doesn't open it again.
  bool _openingVerify = false;

  bool get _busy => _isSubmitting || _socialBusy;

  @override
  void initState() {
    super.initState();
    _initBiometric();
    if (kDebugMode) {
      _emailCtrl.text = 'alexander.perel+maxim@gmail.com';
      _passCtrl.text = 'TestMaxim2026';
    }
  }

  Future<void> _initBiometric() async {
    final svc = ref.read(biometricServiceProvider);
    final enabled = await svc.isEnabled();
    if (!enabled) return;
    // Only show biometric button if a biometric JWT snapshot exists (survives logout)
    final token = await const FlutterSecureStorage().read(key: AppConstants.keyBiometricJwt);
    if (token == null || token.isEmpty) return;
    final canAuth = await svc.canAuthenticate();
    if (!mounted) return;
    setState(() => _biometricAvailable = canAuth);
    // Never auto-trigger — the user must tap the button explicitly.
  }

  void _showLoginError(Object err) {
    if (_openingVerify || !mounted) return;
    final l10n = AppLocalizations.of(context)!;
    String msg;
    var help = false;
    if (err is PasswordLoginException) {
      switch (err.reason) {
        case PasswordLoginFailure.invalidCredentials:
          msg = l10n.loginInvalidCredentials;
          help = true;
        case PasswordLoginFailure.tooManyAttempts:
          msg = l10n.loginTooManyAttempts;
        case PasswordLoginFailure.emailNotVerified:
          // Right password, address not confirmed yet: go straight to code entry
          // with a fresh code, the one from sign-up may have expired.
          final userId = err.userId;
          if (userId != null && userId.isNotEmpty) {
            _confirmThenSignIn(userId);
            return;
          }
          msg = l10n.loginEmailNotVerified;
        case PasswordLoginFailure.network:
          msg = l10n.loginNetworkError;
        case PasswordLoginFailure.server:
          msg = l10n.loginServerError;
      }
    } else {
      msg = err.toString().replaceFirst('Exception: ', '');
    }
    setState(() { _error = msg; _showSignInHelp = help; });
  }

  /// Code entry on top of this screen; once the address is confirmed, sign in with the
  /// email and password still in the form, so nobody has to type them again.
  Future<void> _confirmThenSignIn(String userId) async {
    _openingVerify = true;
    final confirmed = await context.push<bool>(
        '/auth/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}'
        '&userId=${Uri.encodeComponent(userId)}&purpose=email_verification&resend=1');
    _openingVerify = false;
    if (confirmed == true && mounted) await _submit();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _error = null; _showSignInHelp = false; _isSubmitting = true; });
    await ref.read(authStateNotifierProvider.notifier).login(
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    // Belt-and-suspenders: read current state after await in case the listener
    // fired but the setState was batched away before taking effect.
    final authState = ref.read(authStateNotifierProvider);
    if (authState.hasError) _showLoginError(authState.error!);
    setState(() => _isSubmitting = false);
  }

  Future<void> _loginWithBiometrics() async {
    setState(() { _error = null; _showSignInHelp = false; _isSubmitting = true; });
    final svc = ref.read(biometricServiceProvider);
    final l10n = AppLocalizations.of(context)!;
    final authed = await svc.authenticate(reason: l10n.settingsBiometricLogin);
    if (!authed || !mounted) {
      setState(() => _isSubmitting = false);
      return;
    }
    await ref.read(authStateNotifierProvider.notifier).loginWithBiometrics();
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    ref.listen(authStateNotifierProvider, (_, next) {
      next.whenOrNull(
        error: (err, _) {
          if (mounted) _showLoginError(err);
        },
      );
    });

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                Center(
                  child: Image.asset('assets/images/logo.png', width: 72, height: 72),
                ),
                const SizedBox(height: 24),
                Text(l10n.loginWelcomeBack, style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.onSurface)),
                const SizedBox(height: 8),
                Text(l10n.loginSignInSubtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 32),

                if (_error != null) ...[
                  _ErrorBox(message: _error!),
                  if (_showSignInHelp) ...[
                    const SizedBox(height: 4),
                    _SignInHelp(
                      onCreateAccount: () => context.go('/auth/register'),
                      onResetPassword: () => context.push('/auth/forgot-password'),
                    ),
                  ],
                  const SizedBox(height: 16),
                ],

                if (_biometricAvailable) ...[
                  ElevatedButton.icon(
                    onPressed: _busy ? null : _loginWithBiometrics,
                    icon: const Icon(Icons.fingerprint_rounded),
                    label: Text(l10n.loginBiometricButton),
                  ),
                  const SizedBox(height: 12),
                ],

                // Google (and Apple on iOS) first: the quickest way in, no password to forget.
                SocialSignInButtons(
                  enabled: !_busy,
                  onBusy: (b) => setState(() => _socialBusy = b),
                  onError: (msg) => setState(() { _error = msg; _showSignInHelp = false; }),
                ),

                const SizedBox(height: 24),
                const OrWithEmailDivider(),
                const SizedBox(height: 16),

                AutofillGroup(
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        autofillHints: const [AutofillHints.email, AutofillHints.username],
                        decoration: InputDecoration(
                          labelText: l10n.loginEmailLabel,
                          prefixIcon: const Icon(Icons.email_outlined),
                          filled: true,
                          fillColor: theme.colorScheme.surfaceContainerHighest,
                        ),
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
                          filled: true,
                          fillColor: theme.colorScheme.surfaceContainerHighest,
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
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/auth/forgot-password'),
                    child: Text(l10n.loginForgotPassword),
                  ),
                ),
                if (kDebugMode) ...[
                  Row(children: [
                    Expanded(child: OutlinedButton(
                      onPressed: () { _emailCtrl.text = 'alexander.perel+maxim@gmail.com'; _passCtrl.text = 'TestMaxim2026'; },
                      child: const Text('[Dev] Maxim'),
                    )),
                    const SizedBox(width: 8),
                    Expanded(child: OutlinedButton(
                      onPressed: () { _emailCtrl.text = 'alexander.perel+maxima@gmail.com'; _passCtrl.text = 'TestParent2026'; },
                      child: const Text('[Dev] Maxima'),
                    )),
                  ]),
                  const SizedBox(height: 8),
                ],
                const SizedBox(height: 8),
                // Secondary to the social buttons above: tonal, not the full primary fill.
                FilledButton.tonal(
                  key: const Key('login-password-submit'),
                  onPressed: _busy ? null : _submit,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l10n.loginSignInButton),
                ),

                const SizedBox(height: 24),
                Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
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

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      key: const Key('login-error'),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.tierBelowLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        const Icon(Icons.error_outline, color: AppColors.error, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(message, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error))),
      ]),
    );
  }
}

/// The three ways forward after a rejected email + password, identical for every cause.
class _SignInHelp extends StatelessWidget {
  final VoidCallback onCreateAccount;
  final VoidCallback onResetPassword;
  const _SignInHelp({required this.onCreateAccount, required this.onResetPassword});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final muted = theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant);
    Widget action(Key key, IconData icon, String label, VoidCallback onTap) => TextButton.icon(
          key: key,
          onPressed: onTap,
          icon: Icon(icon, size: 20),
          label: Text(label, textAlign: TextAlign.start),
          style: TextButton.styleFrom(alignment: Alignment.centerLeft),
        );
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.arrow_upward_rounded, size: 20, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(child: Text(
            appleSignInOffered ? l10n.loginHelpUseGoogleOrApple : l10n.loginHelpUseGoogle,
            style: muted,
          )),
        ]),
      ),
      action(const Key('login-help-register'), Icons.person_add_alt_1_outlined, l10n.loginHelpCreateAccount, onCreateAccount),
      action(const Key('login-help-reset'), Icons.lock_reset_outlined, l10n.loginHelpResetPassword, onResetPassword),
    ]);
  }
}
