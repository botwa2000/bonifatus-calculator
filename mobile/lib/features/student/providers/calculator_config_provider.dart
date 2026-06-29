import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/services/config_service.dart';
import '../../../models/calculator_config.dart';

class CalculatorConfigNotifier extends AsyncNotifier<CalculatorConfig> {
  @override
  Future<CalculatorConfig> build() async {
    try {
      final service = ref.read(configServiceProvider);
      return service.fetchConfig();
    } catch (_) {
      return CalculatorConfig.fallback;
    }
  }
}

final calculatorConfigProvider =
    AsyncNotifierProvider<CalculatorConfigNotifier, CalculatorConfig>(
  CalculatorConfigNotifier.new,
);
