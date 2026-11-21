import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../api/client.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String userId;
  final String email;
  final String purpose;
  /// Request a new code on arrival (coming from sign-in, the sign-up code may have expired).
  final bool sendCodeOnOpen;
  const VerifyEmailScreen({
    super.key,
    required this.userId,
    required this.email,
    required this.purpose,
    this.sendCodeOnOpen = false,
  });
  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final List<TextEditingController> _ctrls = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _foci = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  bool _isSending = false;
  bool _codeSent = false;
  String? _error;

  bool get _canResend => widget.purpose == 'email_verification' && widget.userId.isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (widget.sendCodeOnOpen && _canResend) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _sendCode());
    }
  }

  /// The server answers the same way for any id and enforces its own cooldown,
  /// within which the previous code stays valid.
  Future<void> _sendCode() async {
    setState(() { _isSending = true; _error = null; });
    try {
      await ref.read(apiClientProvider).post('/api/auth/resend-code', data: {
        'userId': widget.userId,
        'purpose': 'email_verification',
      });
      if (mounted) setState(() => _codeSent = true);
    } catch (_) {
      if (mounted) setState(() => _error = AppLocalizations.of(context)!.verifyEmailFailed);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  void dispose() {
    for (final c in _ctrls) { c.dispose(); }
    for (final f in _foci) { f.dispose(); }
    super.dispose();
  }

  String get _code => _ctrls.map((c) => c.text).join();

  void _onChanged(int i, String v) {
    if (v.length == 1 && i < 5) _foci[i + 1].requestFocus();
    if (v.isEmpty && i > 0) _foci[i - 1].requestFocus();
    if (_code.length == 6) _verify();
  }

  Future<void> _verify() async {
    if (_isLoading) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/api/auth/verify-email', data: {
        'userId': widget.userId,
        'code': _code,
        'purpose': widget.purpose,
      });
      if (!mounted) return;
      // Opened from sign-in: hand back, and the sign-in screen finishes signing in.
      if (context.canPop()) {
        context.pop(true);
      } else {
        context.go('/auth/login');
      }
    } catch (e) {
      String msg = l10n.verifyEmailFailed;
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['code'] == 'INVALID_CODE') {
          msg = l10n.verifyEmailInvalidCode;
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
      appBar: AppBar(title: Text(l10n.verifyEmailAppBarTitle)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 24),
            Text(l10n.verifyEmailTitle, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(l10n.verifyEmailSubtitle(widget.email),
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 40),
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.tierBelowLight, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: TextStyle(color: AppColors.error, fontSize: 13))),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (i) => SizedBox(
                width: 48, height: 56,
                child: TextFormField(
                  controller: _ctrls[i],
                  focusNode: _foci[i],
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 1,
                  decoration: InputDecoration(
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Theme.of(context).colorScheme.outlineVariant, width: 1.5)),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                  ),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                  onChanged: (v) => _onChanged(i, v),
                ),
              )),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading || _code.length < 6 ? null : _verify,
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(l10n.verifyEmailButton),
            ),
            if (_canResend) ...[
              const SizedBox(height: 16),
              if (_codeSent)
                Text(l10n.verifyEmailCodeSent,
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              Center(
                child: TextButton(
                  onPressed: _isSending ? null : _sendCode,
                  child: Text(l10n.verifyEmailSendNewCode),
                ),
              ),
            ],
          ]),
        ),
      ),
    );
  }
}
