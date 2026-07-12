import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';

// 15-minute inactivity timeout. Resets on any pointer event. Calls logout when expired.
class InactivityGuard extends ConsumerStatefulWidget {
  final Widget child;
  const InactivityGuard({super.key, required this.child});

  static const _timeout = Duration(minutes: 15);

  @override
  ConsumerState<InactivityGuard> createState() => _InactivityGuardState();
}

class _InactivityGuardState extends ConsumerState<InactivityGuard> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _reset();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _reset() {
    _timer?.cancel();
    _timer = Timer(InactivityGuard._timeout, _expire);
  }

  Future<void> _expire() async {
    if (!mounted) return;
    await ref.read(authStateNotifierProvider.notifier).logout();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _reset(),
      onPointerMove: (_) => _reset(),
      child: widget.child,
    );
  }
}
