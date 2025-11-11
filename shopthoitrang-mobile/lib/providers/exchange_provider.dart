import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import '../services/doihang_service.dart';

class ExchangeProvider extends ChangeNotifier {
  final _svc = doiHangService;
  List<Map<String, dynamic>> items = [];
  Map<int, Map<String, dynamic>> details = {};
  bool loadingList = false;
  String? listError;

  void _safeNotify() {
    if (SchedulerBinding.instance.schedulerPhase == SchedulerPhase.idle) {
      notifyListeners();
    } else {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        notifyListeners();
      });
    }
  }

  Future<void> fetchList(int maKhachHang) async {
    loadingList = true;
    listError = null;
    _safeNotify();
    final data = await _svc.getMyExchanges(maKhachHang);
    if (data != null) {
      items = data.map((e) => (e as Map<String, dynamic>)).toList();
    } else {
      listError = _svc.lastError;
    }
    loadingList = false;
    _safeNotify();
  }

  Future<void> fetchDetail(int id) async {
    final d = await _svc.getExchange(id);
    if (d != null) {
      details[id] = d;
      _safeNotify();
    }
  }
}
