import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/shipping_config.dart';

class ShippingService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/phivanchuyen';
  String? lastError;

  Future<ShippingConfig?> getConfig() async {
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        lastError = null;
        return ShippingConfig.fromJson(data);
      }
      lastError = 'Status ${response.statusCode}';
    } catch (e) {
      lastError = e.toString();
    }
    return null;
  }
}
