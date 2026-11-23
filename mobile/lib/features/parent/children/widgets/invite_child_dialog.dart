import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:bonifatus_mobile/l10n/app_localizations.dart';
import '../../../../api/services/connection_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/usage/usage_service.dart';
import '../../../../models/invite_code.dart';

/// Where the invite dialog was opened from; sent with `invite_share` so
/// /admin/stats can tell the first-run prompt from the parent's own taps.
enum InviteSource { firstRun, home, children }

extension on InviteSource {
  String get wire => switch (this) {
        InviteSource.firstRun => 'first_run',
        InviteSource.home => 'home',
        InviteSource.children => 'children',
      };
}

/// Creates a fresh invite code and shows it as QR, code and shareable link.
Future<void> showInviteChildDialog(
  BuildContext context,
  WidgetRef ref, {
  required InviteSource source,
}) {
  return showDialog<void>(
    context: context,
    builder: (_) => _InviteChildDialog(ref: ref, source: source),
  );
}

/// Locale-prefixed, so the web page opens in the parent's language instead of
/// being redirected by the browser's Accept-Language.
String inviteUrl(String locale, String code) => 'https://bonifatus.com/$locale/invite?code=$code';

class _InviteChildDialog extends StatefulWidget {
  final WidgetRef ref;
  final InviteSource source;
  const _InviteChildDialog({required this.ref, required this.source});

  @override
  State<_InviteChildDialog> createState() => _InviteChildDialogState();
}

class _InviteChildDialogState extends State<_InviteChildDialog> {
  InviteCode? _invite;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final invite = await widget.ref.read(connectionServiceProvider).createInvite();
      if (mounted) {
        setState(() {
          _invite = invite;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _failed = true;
          _loading = false;
        });
      }
    }
  }

  Future<void> _share(BuildContext buttonContext, String url, String code) async {
    final l10n = AppLocalizations.of(context)!;
    // iPad needs an anchor for the share popover.
    final box = buttonContext.findRenderObject() as RenderBox?;
    final origin = box == null ? null : box.localToGlobal(Offset.zero) & box.size;
    final result = await SharePlus.instance.share(ShareParams(
      text: l10n.inviteShareMessage(url, code),
      subject: l10n.inviteShareSubject,
      sharePositionOrigin: origin,
    ));
    if (result.status != ShareResultStatus.dismissed) {
      UsageService.instance.track('invite_share', props: {'mode': 'share', 'source': widget.source.wire});
    }
  }

  Future<void> _copy(String url) async {
    final l10n = AppLocalizations.of(context)!;
    await Clipboard.setData(ClipboardData(text: url));
    UsageService.instance.track('invite_share', props: {'mode': 'copy', 'source': widget.source.wire});
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.inviteLinkCopied)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final cs = Theme.of(context).colorScheme;
    final invite = _invite;
    final url = invite == null ? null : inviteUrl(Localizations.localeOf(context).languageCode, invite.code);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.childrenInviteStudent,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.inviteDialogHint,
              style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            if (_loading)
              const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
              )
            else if (_failed || invite == null || url == null)
              SizedBox(
                height: 120,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 32),
                      const SizedBox(height: 8),
                      Text(l10n.childrenFailedToCreateInvite, style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 8),
                      TextButton(onPressed: _load, child: Text(l10n.childrenRetry)),
                    ],
                  ),
                ),
              )
            else ...[
              QrImageView(data: url, size: 200, backgroundColor: Colors.white),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  l10n.childrenInviteCode(invite.code),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                    letterSpacing: 6,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: Builder(
                  builder: (buttonContext) => ElevatedButton.icon(
                    onPressed: () => _share(buttonContext, url, invite.code),
                    icon: const Icon(Icons.share_rounded),
                    label: Text(l10n.inviteShareButton),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _copy(url),
                  icon: const Icon(Icons.link_rounded),
                  label: Text(l10n.inviteCopyLink),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(l10n.childrenClose),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
