import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';

import '../../api/client.dart';
import '../theme/app_colors.dart';
import '../usage/usage_service.dart';

/// In-app feedback → POST /api/feedback (stored on our server, the app rating
/// is also emailed to the team). Shown on the dashboard at /admin/stats.
class FeedbackApi {
  FeedbackApi(this._client);
  final ApiClient _client;

  Future<void> rateApp(int rating, String comment, String lang) => _client.post('/api/feedback', data: {
        'kind': 'app',
        'rating': rating,
        if (comment.trim().isNotEmpty) 'comment': comment.trim(),
        'lang': lang,
      });

  /// One-tap rating of a result (e.g. how well a report card was recognised).
  Future<void> rateResult(String action, int rating) => _client.post('/api/feedback', data: {
        'kind': 'result',
        'action': action,
        'rating': rating,
      });
}

final feedbackApiProvider = Provider<FeedbackApi>((ref) => FeedbackApi(ref.read(apiClientProvider)));

/// Parental gate: a multiplication a child cannot guess, required before a
/// child account reaches anything that sends free text or leaves the app.
Future<bool> showParentalGate(BuildContext context, {Random? random}) async {
  final rng = random ?? Random();
  final a = 6 + rng.nextInt(7); // 6..12
  final b = 3 + rng.nextInt(7); // 3..9
  final result = await showDialog<bool>(
    context: context,
    builder: (_) => _ParentalGateDialog(a: a, b: b),
  );
  return result ?? false;
}

class _ParentalGateDialog extends StatefulWidget {
  const _ParentalGateDialog({required this.a, required this.b});
  final int a;
  final int b;

  @override
  State<_ParentalGateDialog> createState() => _ParentalGateDialogState();
}

class _ParentalGateDialogState extends State<_ParentalGateDialog> {
  final _ctrl = TextEditingController();
  bool _wrong = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (int.tryParse(_ctrl.text.trim()) == widget.a * widget.b) {
      Navigator.of(context).pop(true);
    } else {
      setState(() => _wrong = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return AlertDialog(
      title: Text(l10n.parentalGateTitle),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.parentalGateQuestion(widget.a, widget.b)),
          const SizedBox(height: 12),
          TextField(
            key: const Key('parentalGateAnswer'),
            controller: _ctrl,
            autofocus: true,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
            decoration: InputDecoration(
              hintText: l10n.parentalGateAnswerHint,
              errorText: _wrong ? l10n.parentalGateWrong : null,
            ),
            onSubmitted: (_) => _submit(),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(l10n.settingsCancel)),
        FilledButton(onPressed: _submit, child: Text(l10n.parentalGateContinue)),
      ],
    );
  }
}

/// "Rate Bonifatus" bottom sheet: 1–5 stars + optional comment.
Future<void> showFeedbackSheet(BuildContext context) {
  UsageService.instance.track('feedback_open');
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const FeedbackSheet(),
  );
}

class FeedbackSheet extends ConsumerStatefulWidget {
  const FeedbackSheet({super.key});

  @override
  ConsumerState<FeedbackSheet> createState() => _FeedbackSheetState();
}

class _FeedbackSheetState extends ConsumerState<FeedbackSheet> {
  final _comment = TextEditingController();
  int _rating = 0;
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final l10n = AppLocalizations.of(context)!;
    if (_rating == 0) {
      setState(() => _error = l10n.feedbackSelectRating);
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(feedbackApiProvider).rateApp(_rating, _comment.text, Localizations.localeOf(context).languageCode);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(SnackBar(content: Text(l10n.feedbackThanks), backgroundColor: AppColors.tierBest));
    } catch (_) {
      if (mounted) setState(() => _error = l10n.feedbackError);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.feedbackTitle, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(l10n.feedbackSubtitle, style: TextStyle(color: cs.onSurfaceVariant)),
          const SizedBox(height: 16),
          StarRow(rating: _rating, onChanged: (r) => setState(() => _rating = r), size: 40),
          const SizedBox(height: 16),
          TextField(
            key: const Key('feedbackComment'),
            controller: _comment,
            maxLines: 4,
            maxLength: 2000,
            decoration: InputDecoration(hintText: l10n.feedbackCommentHint, border: const OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(_error!, style: TextStyle(color: cs.error)),
          ],
          const SizedBox(height: 12),
          FilledButton(
            key: const Key('feedbackSend'),
            onPressed: _sending ? null : _send,
            child: _sending
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.feedbackSend),
          ),
        ],
      ),
    );
  }
}

/// Five tappable stars.
class StarRow extends StatelessWidget {
  const StarRow({super.key, required this.rating, required this.onChanged, this.size = 32});
  final int rating;
  final ValueChanged<int>? onChanged;
  final double size;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 1; i <= 5; i++)
          IconButton(
            key: Key('star$i'),
            tooltip: l10n.feedbackStarLabel(i),
            iconSize: size,
            onPressed: onChanged == null ? null : () => onChanged!(i),
            icon: Icon(
              i <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
              color: const Color(0xFFF5A623),
            ),
          ),
      ],
    );
  }
}

/// One-tap result rating shown after a scan ("How well were the grades recognised?").
class ResultRatingBar extends ConsumerStatefulWidget {
  const ResultRatingBar({super.key, required this.action});
  final String action;

  @override
  ConsumerState<ResultRatingBar> createState() => _ResultRatingBarState();
}

class _ResultRatingBarState extends ConsumerState<ResultRatingBar> {
  int _rating = 0;

  Future<void> _rate(int r) async {
    setState(() => _rating = r);
    try {
      await ref.read(feedbackApiProvider).rateResult(widget.action, r);
    } catch (_) {
      // A rating is optional; a failed send must never interrupt the flow.
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _rating == 0 ? l10n.scanRatingQuestion : l10n.scanRatingThanks,
          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        StarRow(rating: _rating, onChanged: _rating == 0 ? _rate : null, size: 28),
      ],
    );
  }
}
