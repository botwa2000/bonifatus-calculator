import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/auth_provider.dart';

/// Apple sign-in is offered on iOS (and in store-screenshot builds).
bool get appleSignInOffered =>
    defaultTargetPlatform == TargetPlatform.iOS || const bool.fromEnvironment('SCREENSHOT_MODE');

/// "Continue with Google" and, on iOS, "Continue with Apple": the primary way in on
/// both the sign-in and the sign-up screen. A new account continues on the profile
/// step; an existing one is signed in and the router takes over.
class SocialSignInButtons extends ConsumerStatefulWidget {
  /// Disables the buttons while the host screen is busy with something else.
  final bool enabled;
  /// Reports when a social sign-in starts and ends, so the host can lock its form.
  final ValueChanged<bool> onBusy;
  /// A localized message to show, or null to clear the host's error.
  final ValueChanged<String?> onError;
  /// Role already chosen on the sign-up screen, preselected on the profile step.
  final String? role;

  const SocialSignInButtons({
    super.key,
    required this.onBusy,
    required this.onError,
    this.enabled = true,
    this.role,
  });

  @override
  ConsumerState<SocialSignInButtons> createState() => _SocialSignInButtonsState();
}

class _SocialSignInButtonsState extends ConsumerState<SocialSignInButtons> {
  bool _busy = false;

  void _setBusy(bool busy) {
    if (!mounted) return;
    setState(() => _busy = busy);
    widget.onBusy(busy);
  }

  /// Network trouble gets its own message; anything else is "that didn't work".
  String _failure(Object e, String fallback) {
    final l10n = AppLocalizations.of(context)!;
    if (e is DioException &&
        (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout)) {
      return l10n.loginNetworkError;
    }
    return fallback;
  }

  Map<String, String> _profileExtra(Map<String, String> data) =>
      {...data, if (widget.role != null) 'role': widget.role!};

  Future<void> _google() async {
    final l10n = AppLocalizations.of(context)!;
    if (AppConstants.googleWebClientId.isEmpty) {
      widget.onError(l10n.loginGoogleFailed);
      return;
    }
    widget.onError(null);
    _setBusy(true);
    try {
      // Sign out first so the account picker appears every time (switch accounts after logout).
      await GoogleSignIn.instance.signOut();
      final account = await GoogleSignIn.instance.authenticate();
      final idToken = account.authentication.idToken;
      if (!mounted) return;
      if (idToken == null) {
        debugPrint('[GoogleSignIn] no idToken (SHA-1 not registered?)');
        widget.onError(l10n.loginGoogleFailed);
        return;
      }
      final result =
          await ref.read(authStateNotifierProvider.notifier).loginWithGoogle(idToken: idToken);
      if (!mounted) return;
      if (result is GoogleSignInNeedsProfile) {
        context.push('/auth/google-profile',
            extra: _profileExtra({'idToken': idToken, 'name': result.name, 'email': result.email}));
      }
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) return;
      debugPrint('[GoogleSignIn] ${e.code}: ${e.description}');
      if (mounted) widget.onError(l10n.loginGoogleFailed);
    } on PlatformException catch (e) {
      debugPrint('[GoogleSignIn] ${e.code}: ${e.message} ${e.details}');
      if (mounted) widget.onError(l10n.loginGoogleFailed);
    } catch (e) {
      debugPrint('[GoogleSignIn] $e');
      if (mounted) widget.onError(_failure(e, l10n.loginGoogleFailed));
    } finally {
      _setBusy(false);
    }
  }

  Future<void> _apple() async {
    final l10n = AppLocalizations.of(context)!;
    widget.onError(null);
    _setBusy(true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
      );
      final identityToken = credential.identityToken;
      if (!mounted) return;
      if (identityToken == null) {
        widget.onError(l10n.loginAppleFailed);
        return;
      }
      final name = [credential.givenName ?? '', credential.familyName ?? '']
          .where((s) => s.isNotEmpty)
          .join(' ');
      final result = await ref
          .read(authStateNotifierProvider.notifier)
          .loginWithApple(identityToken: identityToken);
      if (!mounted) return;
      if (result is AppleSignInNeedsProfile) {
        context.push('/auth/apple-profile',
            extra: _profileExtra(
                {'identityToken': identityToken, 'name': name, 'email': result.email}));
      }
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) return;
      debugPrint('[AppleSignIn] ${e.code}: ${e.message}');
      if (mounted) widget.onError(l10n.loginAppleFailed);
    } catch (e) {
      debugPrint('[AppleSignIn] $e');
      if (mounted) widget.onError(_failure(e, l10n.loginAppleFailed));
    } finally {
      _setBusy(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final enabled = widget.enabled && !_busy;

    ButtonStyle style() => OutlinedButton.styleFrom(
          foregroundColor: theme.colorScheme.onSurface,
          backgroundColor: theme.colorScheme.surface,
          side: BorderSide(color: theme.colorScheme.outline, width: 1.5),
          minimumSize: const Size(double.infinity, 56),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        );
    final labelStyle = theme.textTheme.labelLarge
        ?.copyWith(color: theme.colorScheme.onSurface, fontWeight: FontWeight.w600);

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      OutlinedButton.icon(
        key: const Key('social-google'),
        onPressed: enabled ? _google : null,
        icon: SvgPicture.asset('assets/images/google_logo.svg', width: 20, height: 20),
        label: Text(l10n.loginContinueWithGoogle, style: labelStyle),
        style: style(),
      ),
      if (appleSignInOffered) ...[
        const SizedBox(height: 12),
        OutlinedButton.icon(
          key: const Key('social-apple'),
          onPressed: enabled ? _apple : null,
          icon: const Icon(Icons.apple, size: 22),
          label: Text(l10n.loginContinueWithApple, style: labelStyle),
          style: style(),
        ),
      ],
    ]);
  }
}

/// "or with email" between the social buttons and the email form.
class OrWithEmailDivider extends StatelessWidget {
  const OrWithEmailDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(children: [
      const Expanded(child: Divider()),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Text(AppLocalizations.of(context)!.loginOrWithEmail,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ),
      const Expanded(child: Divider()),
    ]);
  }
}
