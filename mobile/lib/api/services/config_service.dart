import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../client.dart';
import '../../models/calculator_config.dart';

final configServiceProvider = Provider<ConfigService>((ref) {
  return ConfigService(ref.read(apiClientProvider));
});

class ConfigService {
  final ApiClient _client;
  ConfigService(this._client);

  Future<CalculatorConfig> fetchConfig({String locale = 'en'}) async {
    final resp = await _client.get('/api/config/calculator');
    return CalculatorConfig.fromJson(resp.data as Map<String, dynamic>, locale: locale);
  }
}
