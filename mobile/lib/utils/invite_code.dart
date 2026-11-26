/// Parent → child invite codes, mirroring lib/connections/invite-code.ts on the server.
///
/// 10 symbols of Crockford base32 (no I, L, O, U), stored without a separator and
/// shown as "ABCDE-FGHJK". Input forgives lower case, spaces, dashes and the
/// look-alikes O → 0, I/L → 1, so a child can type what they see.
library;

const inviteCodeLength = 10;
final _canonical = RegExp(r'^[0-9A-HJKMNP-TV-Z]{10}$');

/// Canonical code from typed text, a scanned code or an invite link; null if none.
String? normalizeInviteCode(String input) {
  var raw = input.trim();
  if (raw.contains('code=')) {
    raw = Uri.tryParse(raw)?.queryParameters['code'] ?? raw;
  }
  if (raw.length > 40) return null;
  final code = raw
      .toUpperCase()
      .replaceAll(RegExp(r'[\s-]'), '')
      .replaceAll('O', '0')
      .replaceAll(RegExp(r'[IL]'), '1');
  return _canonical.hasMatch(code) ? code : null;
}

/// "ABCDEFGHJK" → "ABCDE-FGHJK".
String formatInviteCode(String code) =>
    code.length == inviteCodeLength ? '${code.substring(0, 5)}-${code.substring(5)}' : code;
