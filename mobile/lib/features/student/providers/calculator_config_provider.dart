import 'dart:ui' as ui;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/config_service.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../models/calculator_config.dart';

class CalculatorConfigNotifier extends AsyncNotifier<CalculatorConfig> {
  @override
  Future<CalculatorConfig> build() async {
    final selectedLocale = await ref.watch(localeProvider.future);
    final locale = selectedLocale?.languageCode ??
        (ui.PlatformDispatcher.instance.locales.isNotEmpty
            ? ui.PlatformDispatcher.instance.locales.first.languageCode
            : 'en');
    try {
      final service = ref.read(configServiceProvider);
      return service.fetchConfig(locale: locale);
    } catch (_) {
      return CalculatorConfig.fallback;
    }
  }
}

final calculatorConfigProvider =
    AsyncNotifierProvider<CalculatorConfigNotifier, CalculatorConfig>(
  CalculatorConfigNotifier.new,
);
