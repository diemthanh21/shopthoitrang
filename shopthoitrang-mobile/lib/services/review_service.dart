import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/review_model.dart';

class ReviewService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/danhgia';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  Future<List<Review>?> getReviews({int? productId, int? customerId}) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final query = <String, String>{};
      if (productId != null) {
        query['masanpham'] = productId.toString();
      }
      if (customerId != null) {
        query['makhachhang'] = customerId.toString();
      }

      var url = baseUrl;
      if (query.isNotEmpty) {
        final queryString = query.entries
            .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
            .join('&');
        url = '$url?$queryString';
      }

      final res = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode != 200) {
        try {
          final body = json.decode(res.body);
          lastError = (body['message'] ?? body['error'] ?? res.body).toString();
        } catch (_) {
          lastError = 'Lỗi khi tải đánh giá: ${res.statusCode}';
        }
        return null;
      }

      lastError = null;
      final decoded = json.decode(res.body);
      if (decoded is! List) {
        lastError = 'Unexpected payload format';
        return null;
      }

      final reviews = decoded.map<Review>((item) {
        if (item is Map<String, dynamic>) {
          item['tenkhachhang'] ??=
              item['hoten'] ?? item['tendangnhap'] ?? item['email'];
          item['hinhanhkhachhang'] ??= item['hinhanh'];
        }
        return Review.fromJson(item as Map<String, dynamic>);
      }).toList();

      final missingIds = reviews
          .where(
              (r) => r.customerName == null || r.customerName!.trim().isEmpty)
          .map((r) => r.customerId)
          .toSet();

      for (final cid in missingIds) {
        try {
          final detailRes = await http.get(
            Uri.parse('${AppConfig.apiBaseUrl}/taikhoankhachhang/$cid'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          );
          if (detailRes.statusCode == 200) {
            final j = json.decode(detailRes.body);
            final name = j['hoten'] ?? j['tendangnhap'] ?? j['email'];
            final img = j['hinhanh'];
            for (var i = 0; i < reviews.length; i++) {
              final r = reviews[i];
              if (r.customerId == cid &&
                  (r.customerName == null || r.customerName!.isEmpty)) {
                reviews[i] = r.copyWith(
                  customerName: name?.toString(),
                  customerImage: img?.toString(),
                );
              }
            }
          }
        } catch (_) {
          // ignore enrichment errors
        }
      }

      return reviews;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Review?> createReview({
    required int productId,
    required int customerId,
    required int rating,
    String? comment,
    String? images,
    int? orderDetailId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final payload = {
        'masanpham': productId,
        'makhachhang': customerId,
        'diemdanhgia': rating,
        if (comment != null && comment.isNotEmpty) 'binhluan': comment,
        if (images != null && images.isNotEmpty) 'hinhanh': images,
        if (orderDetailId != null) 'machitietdonhang': orderDetailId,
      };

      final res = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(payload),
      );

      if (res.statusCode == 201) {
        lastError = null;
        return Review.fromJson(json.decode(res.body));
      }
      try {
        final body = json.decode(res.body);
        lastError = (body['message'] ?? body['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi tạo đánh giá: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Review?> updateReview(
      int reviewId, Map<String, dynamic> updates) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.put(
        Uri.parse('$baseUrl/$reviewId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(updates),
      );
      if (res.statusCode == 200) {
        lastError = null;
        return Review.fromJson(json.decode(res.body));
      }
      try {
        final body = json.decode(res.body);
        lastError = (body['message'] ?? body['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi cập nhật đánh giá: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<bool> deleteReview(int reviewId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return false;
      }
      final res = await http.delete(
        Uri.parse('$baseUrl/$reviewId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        return true;
      }
      try {
        final body = json.decode(res.body);
        lastError = (body['message'] ?? body['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi xóa đánh giá: ${res.statusCode}';
      }
      return false;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }
}

final reviewService = ReviewService();
