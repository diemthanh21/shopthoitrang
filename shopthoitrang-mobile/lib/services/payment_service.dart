import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

class PaymentCheckoutPayload {
  PaymentCheckoutPayload({
    this.autoSubmitHtml,
    this.launchUrl,
  });

  final String? autoSubmitHtml;
  final String? launchUrl;

  bool get hasHtml => autoSubmitHtml != null && autoSubmitHtml!.isNotEmpty;
}

class PaymentService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/sepay';
  String? lastError;

  Future<PaymentCheckoutPayload?> createSepayPayment({
    required int orderId,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
  }) async {
    final token = await _getToken();
    if (token == null) {
      lastError = 'Chua dang nhap';
      return null;
    }

    final body = <String, dynamic>{
      'orderId': orderId,
    };
    if (customerName != null && customerName.isNotEmpty) {
      body['customerName'] = customerName;
    }
    if (customerPhone != null && customerPhone.isNotEmpty) {
      body['customerPhone'] = customerPhone;
    }
    if (customerEmail != null && customerEmail.isNotEmpty) {
      body['customerEmail'] = customerEmail;
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/order'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(response.body);
        final payload = _parseCheckoutPayload(data);
        if (payload != null) {
          lastError = null;
          return payload;
        }
        lastError = 'Khong tim thay thong tin thanh toan.';
        return null;
      } else {
        lastError = _extractError(response.body);
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  PaymentCheckoutPayload? _parseCheckoutPayload(dynamic response) {
    if (response is Map<String, dynamic>) {
      final html = response['auto_submit_html'] as String?;
      final url = response['checkout_url'] as String? ??
          response['payment_url'] as String? ??
          response['pay_url'] as String? ??
          response['url'] as String?;

      if (html != null && html.isNotEmpty) {
        return PaymentCheckoutPayload(autoSubmitHtml: html, launchUrl: url);
      }

      if (response['form_fields'] is Map<String, dynamic> && response['checkout_url'] is String) {
        final htmlString = _buildAutoSubmitHtml(
          response['checkout_url'] as String,
          (response['form_fields'] as Map<String, dynamic>).map(
            (key, value) => MapEntry(key.toString(), value?.toString() ?? ''),
          ),
        );
        return PaymentCheckoutPayload(autoSubmitHtml: htmlString, launchUrl: url);
      }

      if (response['data'] is Map<String, dynamic>) {
        return _parseCheckoutPayload(response['data']);
      }

      if (url != null) {
        return PaymentCheckoutPayload(autoSubmitHtml: null, launchUrl: url);
      }
    }
    return null;
  }

  String _buildAutoSubmitHtml(String action, Map<String, String> fields) {
    final buffer = StringBuffer()
      ..writeln('<!DOCTYPE html>')
      ..writeln('<html><head><meta charset="utf-8"><title>Redirecting</title></head>')
      ..writeln('<body>')
      ..writeln('<form id="sepay" method="POST" action="$action">');
    fields.forEach((key, value) {
      buffer.writeln('<input type="hidden" name="$key" value="$value"/>');
    });
    buffer
      ..writeln('</form>')
      ..writeln('<script>document.getElementById("sepay").submit();</script>')
      ..writeln('<noscript><button type="submit" form="sepay">Continue</button></noscript>')
      ..writeln('</body></html>');
    return buffer.toString();
  }

  String _extractError(String body) {
    try {
      final parsed = json.decode(body);
      if (parsed is Map<String, dynamic>) {
        return (parsed['message'] ?? parsed['error'] ?? body).toString();
      }
      return body;
    } catch (_) {
      return body;
    }
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }
}
