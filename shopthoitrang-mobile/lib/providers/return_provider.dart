import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import '../services/trahang_service.dart';

class ReturnProvider extends ChangeNotifier {
  final _svc = trahangService;
  List<Map<String, dynamic>> items = [];
  Map<int, Map<String, dynamic>> details = {};
  bool loadingList = false;
  String? listError;

  void _safeNotify() {
    // Avoid "setState during build" by deferring notifications until after the current frame
    if (SchedulerBinding.instance.schedulerPhase == SchedulerPhase.idle) {
      notifyListeners();
    } else {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        // Double-check we're still mounted in a sense of provider lifecycle
        // ChangeNotifier doesn't have mounted; but it's safe to notify again or be a no-op if no listeners
        notifyListeners();
      });
    }
  }

  Future<void> fetchList() async {
    loadingList = true;
    listError = null;
    _safeNotify();
    final data = await _svc.getMyReturns();
    if (data != null) {
      items = data.map((e) => (e as Map<String, dynamic>)).toList();
    } else {
      listError = _svc.lastError;
    }
    loadingList = false;
    _safeNotify();
  }

  Future<void> fetchDetail(int id) async {
    final d = await _svc.getReturn(id);
    if (d != null) {
      details[id] = d;
      _safeNotify();
    }
  }

  Future<bool> previewRefund(int id) async {
    final res = await _svc.previewRefund(id);
    if (res != null && details[id] != null) {
      details[id]!['preview_sotien_hoan'] = res['preview_sotien_hoan'];
      _safeNotify();
      return true;
    }
    return false;
  }

  Future<bool> calcRefund(int id) async {
    final res = await _svc.calculateRefund(id);
    if (res != null) {
      // server returns full object
      details[id] = res;
      // Also patch list item if present
      final idx = items.indexWhere((e) => e['matrahang'] == id);
      if (idx != -1) items[idx] = res;
      _safeNotify();
      return true;
    }
    return false;
  }

  Future<bool> processRefund(int id) async {
    final res = await _svc.processRefund(id);
    if (res != null) {
      details[id] = res;
      final idx = items.indexWhere((e) => e['matrahang'] == id);
      if (idx != -1) items[idx] = res;
      _safeNotify();
      return true;
    }
    return false;
  }
}
