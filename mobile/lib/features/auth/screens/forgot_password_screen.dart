import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
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

  @override
  void dispose() {
    _emailCtrl.dispose(); _codeCtrl.dispose(); _passCtrl.dispose();
    super.dispose();
  }

  String _extractError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        return (data['error'] ?? data['message'] ?? 'Request failed').toString();
      }
    }
    return e.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _sendCode() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/api/auth/forgot-password', data: {'email': _emailCtrl.text.trim()});
      setState(() => _step = 1);
    } catch (e) {
      setState(() => _error = _extractError(e));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/api/auth/reset-password', data: {
        'email': _emailCtrl.text.trim(),
        'code': _codeCtrl.text.trim(),
        'password': _passCtrl.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password updated! Sign in with your new password.')));
        context.go('/auth/login');
      }
    } catch (e) {
      setState(() => _error = _extractError(e));
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
        title: const Text('Reset Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _step == 0 ? _buildStep1(theme) : _buildStep2(theme),
        ),
      ),
    );
  }

  Widget _buildStep1(ThemeData theme) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 24),
    Text('Forgot your password?', style: theme.textTheme.headlineMedium),
    const SizedBox(height: 8),
    Text("Enter your email and we'll send you a reset code.", style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
    const SizedBox(height: 32),
    if (_error != null) ...[
      _ErrorBox(message: _error!),
      const SizedBox(height: 16),
    ],
    TextFormField(
      controller: _emailCtrl,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) => _sendCode(),
      decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
    ),
    const SizedBox(height: 24),
    ElevatedButton(
      onPressed: _isLoading ? null : _sendCode,
      child: _isLoading ? const _Spinner() : const Text('Send Reset Code'),
    ),
  ]);

  Widget _buildStep2(ThemeData theme) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 24),
    Text('Check your email', style: theme.textTheme.headlineMedium),
    const SizedBox(height: 8),
    Text('Enter the code we sent to ${_emailCtrl.text}.', style: theme.textTheme.bodyLarge?.copyWith(color: AppColors.neutral600)),
    const SizedBox(height: 32),
    if (_error != null) ...[
      _ErrorBox(message: _error!),
      const SizedBox(height: 16),
    ],
    TextFormField(
      controller: _codeCtrl,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.next,
      maxLength: 8,
      decoration: const InputDecoration(labelText: 'Reset code', prefixIcon: Icon(Icons.pin_outlined)),
    ),
    const SizedBox(height: 16),
    TextFormField(
      controller: _passCtrl,
      obscureText: true,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) => _resetPassword(),
      decoration: const InputDecoration(labelText: 'New password', prefixIcon: Icon(Icons.lock_outline)),
    ),
    const SizedBox(height: 24),
    ElevatedButton(
      onPressed: _isLoading ? null : _resetPassword,
      child: _isLoading ? const _Spinner() : const Text('Reset Password'),
    ),
    const SizedBox(height: 12),
    Center(
      child: TextButton(
        onPressed: _sendCode,
        child: const Text('Resend code'),
      ),
    ),
  ]);
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
