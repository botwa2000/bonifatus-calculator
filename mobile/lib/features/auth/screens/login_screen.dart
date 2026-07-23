import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/app_constants.dart';
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
  bool _isSubmitting = false;
  bool _biometricAvailable = false;
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
    // Only show biometric button if a biometric JWT snapshot exists (survives logout)
    final token = await const FlutterSecureStorage().read(key: AppConstants.keyBiometricJwt);
    if (token == null || token.isEmpty) return;
    final canAuth = await svc.canAuthenticate();
    if (!mounted) return;
    setState(() => _biometricAvailable = canAuth);
    // Never auto-trigger — the user must tap the button explicitly.
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _error = null; _isSubmitting = true; });
    await ref.read(authStateNotifierProvider.notifier).login(
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    // Belt-and-suspenders: read current state after await in case the listener
    // fired but the setState was batched away before taking effect.
    final authState = ref.read(authStateNotifierProvider);
    if (authState.hasError) {
      setState(() => _error = authState.error?.toString().replaceFirst('Exception: ', ''));
    }
    setState(() => _isSubmitting = false);
  }

  Future<void> _loginWithGoogle() async {
    if (AppConstants.googleWebClientId.isEmpty) {
      setState(() => _error = 'Google Sign-In not configured yet.');
      return;
    }
    setState(() { _error = null; _isSubmitting = true; });
    try {
      // Always sign out first so the account picker appears on every tap,
      // not just the first time. This lets users switch accounts after logout.
      await GoogleSignIn.instance.signOut();
      final account = await GoogleSignIn.instance.authenticate();
      debugPrint('[GoogleSignIn] authenticate() result: $account');
      final auth = account.authentication;
      final idToken = auth.idToken;
      debugPrint('[GoogleSignIn] idToken null=${idToken == null}');
      if (idToken == null || !mounted) {
        setState(() { _error = 'Could not get Google token — SHA-1 certificate may not be registered in Google Cloud Console.'; _isSubmitting = false; });
        return;
      }
      final result = await ref.read(authStateNotifierProvider.notifier).loginWithGoogle(idToken: idToken);
      if (!mounted) return;
      if (result is GoogleSignInNeedsProfile) {
        context.push('/auth/google-profile', extra: {
          'idToken': idToken,
          'name': result.name,
          'email': result.email,
        });
      }
    } on GoogleSignInException catch (e) {
      debugPrint('[GoogleSignIn] GoogleSignInException code=${e.code} description=${e.description}');
      if (e.code == GoogleSignInExceptionCode.canceled) {
        // User cancelled — stay silent
        return;
      }
      if (mounted) {
        setState(() => _error = e.description ?? 'Google Sign-In error');
      }
    } on PlatformException catch (e) {
      debugPrint('[GoogleSignIn] PlatformException code=${e.code} message=${e.message} details=${e.details}');
      if (mounted) {
        final details = e.details?.toString() ?? '';
        final String msg;
        if (e.code == 'sign_in_failed' && (details.contains('10') || details.contains('DEVELOPER_ERROR'))) {
          msg = 'Google Sign-In: app signing certificate not registered. Contact support.';
        } else if (e.code == 'sign_in_failed') {
          msg = 'Google Sign-In failed. Please try again.';
        } else {
          msg = e.message ?? 'Google Sign-In error (${e.code})';
        }
        setState(() => _error = msg);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _loginWithBiometrics() async {
    setState(() { _error = null; _isSubmitting = true; });
    final svc = ref.read(biometricServiceProvider);
    final authed = await svc.authenticate();
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
          if (mounted) {
            setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
          }
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Center(
                  child: Image.asset('assets/images/logo.png', width: 72, height: 72),
                ),
                const SizedBox(height: 24),
                Text(l10n.loginWelcomeBack, style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.onSurface)),
                const SizedBox(height: 8),
                Text(l10n.loginSignInSubtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/auth/forgot-password'),
                    child: Text(l10n.loginForgotPassword),
                  ),
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: OutlinedButton(
                      onPressed: () { _emailCtrl.text = 'alexander.perel+maxim@gmail.com'; _passCtrl.text = 'TestMaxim2026'; },
                      child: const Text('[Dev] Maxim'),
                    )),
                    const SizedBox(width: 8),
                    Expanded(child: OutlinedButton(
                      onPressed: () { _emailCtrl.text = 'alexander.perel+maxima@gmail.com'; _passCtrl.text = 'TestMaxim2026'; },
                      child: const Text('[Dev] Maxima'),
                    )),
                  ]),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(l10n.loginSignInButton),
                ),

                if (_biometricAvailable) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _isSubmitting ? null : _loginWithBiometrics,
                    icon: const Icon(Icons.fingerprint_rounded),
                    label: Text(l10n.loginBiometricButton),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      minimumSize: const Size(double.infinity, 56),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],

                const SizedBox(height: 16),
                Row(children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(l10n.loginOrDivider, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  ),
                  const Expanded(child: Divider()),
                ]),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _isSubmitting ? null : _loginWithGoogle,
                  icon: SvgPicture.asset('assets/images/google_logo.svg', width: 20, height: 20),
                  label: Text(l10n.loginContinueWithGoogle,
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    )),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.onSurface,
                    side: BorderSide(color: theme.colorScheme.outline),
                    minimumSize: const Size(double.infinity, 56),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    backgroundColor: theme.colorScheme.surface,
                  ),
                ),
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
