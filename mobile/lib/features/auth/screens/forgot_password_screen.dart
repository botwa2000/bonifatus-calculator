import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../api/client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  int _step = 0;
  bool _isLoading = false;
  String? _error;
  DateTime? _lastSentAt;

  @override
  void dispose() {
    _emailCtrl.dispose(); _codeCtrl.dispose(); _passCtrl.dispose();
    super.dispose();
  }

  String _extractError(dynamic e, AppLocalizations l10n) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        return (data['error'] ?? data['message'] ?? l10n.genericRequestFailed).toString();
      }
    }
    return e.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _sendCode() async {
    if (_isLoading) return;
    final l10n = AppLocalizations.of(context)!;
    // Prevent rapid-fire: enforce 30-second cooldown between sends
    final now = DateTime.now();
    if (_lastSentAt != null && now.difference(_lastSentAt!).inSeconds < 30) {
      final remaining = 30 - now.difference(_lastSentAt!).inSeconds;
      setState(() => _error = l10n.forgotPasswordCooldownMessage(remaining));
      return;
    }
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/api/auth/forgot-password', data: {'email': _emailCtrl.text.trim()});
      _lastSentAt = DateTime.now();
      setState(() => _step = 1);
    } catch (e) {
      setState(() => _error = _extractError(e, l10n));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/api/auth/reset-password', data: {
        'email': _emailCtrl.text.trim(),
        'code': _codeCtrl.text.trim(),
        'newPassword': _passCtrl.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.forgotPasswordUpdatedSnackbar)));
        context.go('/auth/login');
      }
    } catch (e) {
      setState(() => _error = _extractError(e, l10n));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => _step == 1 ? setState(() => _step = 0) : context.pop()),
        title: Text(AppLocalizations.of(context)!.forgotPasswordAppBarTitle),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _step == 0 ? _buildStep1(context, theme) : _buildStep2(context, theme),
        ),
      ),
    );
  }

  Widget _buildStep1(BuildContext context, ThemeData theme) {
    final l10n = AppLocalizations.of(context)!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 24),
      Text(l10n.forgotPasswordStep1Title, style: theme.textTheme.headlineMedium),
      const SizedBox(height: 8),
      Text(l10n.forgotPasswordStep1Subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      const SizedBox(height: 32),
      if (_error != null) ...[
        _ErrorBox(message: _error!),
        const SizedBox(height: 16),
      ],
      TextFormField(
        controller: _emailCtrl,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) { if (!_isLoading) _sendCode(); },
        decoration: InputDecoration(labelText: l10n.forgotPasswordEmailLabel, prefixIcon: const Icon(Icons.email_outlined)),
      ),
      const SizedBox(height: 24),
      ElevatedButton(
        onPressed: _isLoading ? null : _sendCode,
        child: _isLoading ? const _Spinner() : Text(l10n.forgotPasswordSendCodeButton),
      ),
    ]);
  }

  Widget _buildStep2(BuildContext context, ThemeData theme) {
    final l10n = AppLocalizations.of(context)!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 24),
      Text(l10n.forgotPasswordStep2Title, style: theme.textTheme.headlineMedium),
      const SizedBox(height: 8),
      Text(l10n.forgotPasswordStep2Subtitle(_emailCtrl.text), style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      const SizedBox(height: 32),
      if (_error != null) ...[
        _ErrorBox(message: _error!),
        const SizedBox(height: 16),
      ],
      TextFormField(
        controller: _codeCtrl,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.next,
        maxLength: 6,
        decoration: InputDecoration(labelText: l10n.forgotPasswordResetCodeLabel, prefixIcon: const Icon(Icons.pin_outlined)),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _passCtrl,
        obscureText: true,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) => _resetPassword(),
        decoration: InputDecoration(labelText: l10n.forgotPasswordNewPasswordLabel, prefixIcon: const Icon(Icons.lock_outline)),
      ),
      const SizedBox(height: 24),
      ElevatedButton(
        onPressed: _isLoading ? null : _resetPassword,
        child: _isLoading ? const _Spinner() : Text(l10n.forgotPasswordResetButton),
      ),
      const SizedBox(height: 12),
      Center(
        child: TextButton(
          onPressed: _isLoading ? null : _sendCode,
          child: Text(l10n.forgotPasswordResendCode),
        ),
      ),
    ]);
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: AppColors.tierBelowLight, borderRadius: BorderRadius.circular(12)),
    child: Row(children: [
      const Icon(Icons.error_outline, color: AppColors.error, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Text(message, style: TextStyle(color: AppColors.error, fontSize: 13))),
    ]),
  );
}

class _Spinner extends StatelessWidget {
  const _Spinner();
  @override
  Widget build(BuildContext context) => const SizedBox(height: 20, width: 20,
    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white));
}
