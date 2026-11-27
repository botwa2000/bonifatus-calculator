import 'package:bonifatus_mobile/utils/format_utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses the locale decimal separator', () {
    expect(localizeDecimal('1.71', 'de'), '1,71');
    expect(localizeDecimal('≈ 2.3', 'ru'), '≈ 2,3');
    expect(localizeDecimal('1.71', 'en'), '1.71');
    expect(localizeDecimal('B+', 'de'), 'B+');
    expect(localizeDecimal('85%', 'de'), '85%');
  });
}
