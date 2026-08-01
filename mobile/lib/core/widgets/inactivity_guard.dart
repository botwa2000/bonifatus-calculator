import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';

// 15-minute inactivity timeout. Resets on any pointer event.
// Also checks elapsed wall-clock time on app resume so that backgrounding
// the app for longer than the timeout still triggers logout.
class InactivityGuard extends ConsumerStatefulWidget {
  final Widget child;
  const InactivityGuard({super.key, required this.child});

  static const _timeout = Duration(minutes: 15);

  @override
  ConsumerState<InactivityGuard> createState() => _InactivityGuardState();
}

class _InactivityGuardState extends ConsumerState<InactivityGuard>
    with WidgetsBindingObserver {
  Timer? _timer;
  DateTime _lastActivity = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _reset();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final elapsed = DateTime.now().difference(_lastActivity);
      if (elapsed >= InactivityGuard._timeout) {
        _expire();
      } else {
        // Resume the timer for whatever time remains.
        _timer?.cancel();
        _timer = Timer(InactivityGuard._timeout - elapsed, _expire);
      }
    } else if (state == AppLifecycleState.paused) {
      // Stop the in-process timer — wall-clock check on resume handles it.
      _timer?.cancel();
    }
  }

  void _reset() {
    _lastActivity = DateTime.now();
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
