import 'api_client.dart';
import '../models/banner_model.dart';

class BannerService {
  final ApiClient _api;
  BannerService(this._api);

  Future<List<BannerModel>> list({bool? active}) async {
    final query = active == null ? '' : '?active=$active';
    final json = await _api.get('/banner$query');

    dynamic raw = json['items'];
    raw ??= json['data'];
    raw ??= json['banners'];
    raw ??= json['result'];
    if (raw is Map && raw['items'] is List) raw = raw['items'];

    if (raw is List) {
      return raw
          .where((e) => e is Map)
          .map((e) => BannerModel.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    return [];
  }
}
