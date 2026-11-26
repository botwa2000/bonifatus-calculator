import 'package:bonifatus_mobile/utils/invite_code.dart';
import 'package:flutter_test/flutter_test.dart';

// Mirrors lib/connections/invite-security.test.ts on the server.
void main() {
  test('accepts typed, scanned and linked codes', () {
    expect(normalizeInviteCode('abcde-fghjk'), 'ABCDEFGHJK');
    expect(normalizeInviteCode(' AB CDE FGH JK '), 'ABCDEFGHJK');
    expect(normalizeInviteCode('O0IL1-ABCDE'), '00111ABCDE');
    expect(normalizeInviteCode('https://bonifatus.com/de/invite?code=ABCDEFGHJK'), 'ABCDEFGHJK');
  });

  test('rejects old 6-digit codes and foreign symbols', () {
    expect(normalizeInviteCode('123456'), isNull);
    expect(normalizeInviteCode('ABCDEFGHJU'), isNull);
    expect(normalizeInviteCode('ABCDEFGHJKM'), isNull);
    expect(normalizeInviteCode('A' * 41), isNull);
  });

  test('formats in two groups of five', () {
    expect(formatInviteCode('ABCDEFGHJK'), 'ABCDE-FGHJK');
  });
}
