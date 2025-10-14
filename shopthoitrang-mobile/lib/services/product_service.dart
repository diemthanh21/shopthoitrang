import 'dart:convert';
import 'api_client.dart';
import '../models/product.dart';

class ProductService {
  final ApiClient _api;
  ProductService(this._api);

  Future<List<Product>> getProducts() async {
    // Gọi API lấy danh sách sản phẩm
    final res = await _api.get('/sanpham');

    // Nếu ApiClient.get() đã trả về JSON (Map hoặc List), KHÔNG cần jsonDecode nữa
    final body = res; // res chính là Map hoặc List rồi

    // Lấy mảng dữ liệu (xử lý 2 trường hợp: {data: [...]} hoặc [...] trực tiếp)
    final List data = (body is Map && body['data'] is List)
        ? body['data']
        : (body as List? ?? []);

    // Chuyển sang danh sách Product
    return data
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
