import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import '../services/order_service.dart';
import '../services/payment_service.dart';

import '../config/app_config.dart';

class MomoPaymentScreen extends StatefulWidget {
  const MomoPaymentScreen({
    super.key,
    required this.orderId,
    required this.qrOrPayUrl,
    this.timeout = const Duration(minutes: 10),
  });

  final int orderId;
  final String qrOrPayUrl;
  final Duration timeout;

  @override
  State<MomoPaymentScreen> createState() => _MomoPaymentScreenState();
}

class _MomoPaymentScreenState extends State<MomoPaymentScreen> with WidgetsBindingObserver {
  Timer? _countdownTimer;
  Timer? _pollTimer;
  late int _remaining;
  bool _closing = false;
  bool _prompted = false;
  bool _timeoutHandled = false;
  StreamSubscription<Uri>? _linkSub;
  AppLinks? _appLinks;
  final PaymentService _paymentService = PaymentService();
  bool _ipnConfirmed = false; // set true once server reflects paid status
  int _pollIntervalSeconds = 3;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _remaining = widget.timeout.inSeconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_remaining <= 0) {
        _countdownTimer?.cancel();
        _onTimeout();
      } else {
        setState(() => _remaining--);
      }
    });
    // Start polling order status every 3s
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollStatus());

    // Deep link handling: capture callbacks when user returns from MoMo app
    _initDeepLinkListener();
  }

  Future<void> _initDeepLinkListener() async {
    try {
      _appLinks = AppLinks();
      // Initial link (in case app resumed via callback)
      final initial = await _appLinks!.getInitialLink();
      if (initial != null) {
        _handleIncomingUri(initial);
      }
      // Stream for links while app is open
      _linkSub = _appLinks!.uriLinkStream.listen((uri) {
        _handleIncomingUri(uri);
      }, onError: (_) {});
    } catch (_) {}
  }

  void _handleIncomingUri(Uri uri) {
    if (_closing) return;
    // Accept custom scheme: shopthoitrang://momo-callback?resultCode=0&orderId=...&message=...
    final schemeOk = uri.scheme == 'shopthoitrang';
    final hostOk = uri.host == 'momo-callback';
    if (!schemeOk || !hostOk) return;

    final resultCodeStr = uri.queryParameters['resultCode'] ?? uri.queryParameters['code'];
    final resultCode = int.tryParse(resultCodeStr ?? '');
    if (resultCode == null) return;

    if (resultCode == 0) {
      // Người dùng đã thanh toán thành công trong app MoMo.
      // 1) Thử kiểm tra trực tiếp với server/MoMo qua /momo/verify để nhận tín hiệu nhanh.
      // 2) Đồng thời tăng tốc polling để bắt kịp IPN (nếu tới sau).
      _onMomoAppSuccessCallback();
    } else {
      // Non-success: offer options
      _showCancelOrChangeDialog();
    }
  }

  Future<void> _onMomoAppSuccessCallback() async {
    if (!mounted || _closing) return;

    // Tăng tốc polling để nếu IPN tới sau vẫn bắt kịp.
    _acceleratePolling();

    // Thử verify trực tiếp với MoMo qua server để xác nhận nhanh.
    try {
      final result = await _paymentService.verifyMomoPayment(orderId: widget.orderId);
      if (!mounted || _closing) return;

      if (result.paid) {
        _closing = true;
        final status = result.orderStatus ?? 'Chờ lấy hàng';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đã xác nhận thanh toán từ MoMo. Trạng thái đơn: $status')),
        );
        await _clearCheckoutStateLocal();
        Navigator.of(context).pop(true);
        return;
      } else {
        // Nếu MoMo chưa xác nhận xong (query trả chưa thành công),
        // hiển thị thông báo nhẹ và tiếp tục chờ IPN/polling.
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã thanh toán trong MoMo, đang chờ hệ thống xác nhận...')),
        );
      }
    } catch (_) {
      // Nếu verify lỗi (mạng, sandbox chậm, ...), chỉ log nhẹ và tiếp tục chờ.
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã thanh toán trong MoMo. Đang chờ IPN...')),
      );
    }
  }

  void _acceleratePolling() {
    // After user completed payment, poll faster for IPN confirmation
    if (_pollIntervalSeconds <= 1) return;
    _pollIntervalSeconds = 2;
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(Duration(seconds: _pollIntervalSeconds), (_) => _pollStatus());
  }

  Future<void> _clearCheckoutStateLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('provisional_order_id');
      await prefs.remove('checkout_in_progress');
    } catch (_) {}
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _countdownTimer?.cancel();
    _pollTimer?.cancel();
    _linkSub?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // When user returns from MoMo, check status; if still unpaid, offer options once
      if (!_prompted) {
        Future.delayed(const Duration(milliseconds: 400), () async {
          if (!mounted) return;
          final paid = await _checkPaidOnce();
          if (!paid && mounted) {
            _showCancelOrChangeDialog();
          }
        });
      }
    }
  }

  Future<void> _pollStatus() async {
    if (_closing) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${AppConfig.apiBaseUrl}/donhang/${widget.orderId}/status');
      final resp = await http.get(url, headers: { 'Authorization': 'Bearer $token' });
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body) as Map<String, dynamic>;
        final status = (data['trangthaithanhtoan'] ?? '').toString().toLowerCase();
        if (status.contains('da thanh toan')) {
          _ipnConfirmed = true;
          _closing = true;
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('IPN xác nhận: thanh toán MoMo thành công')),
          );
          await _clearCheckoutStateLocal();
          Navigator.of(context).pop(true);
        } else {
          if (mounted && _ipnConfirmed == false) {
            setState(() {}); // trigger rebuild for waiting indicator
          }
        }
      }
    } catch (_) {}
  }

  Future<bool> _checkPaidOnce() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? prefs.getString('auth_token');
      if (token == null) return false;
      final url = Uri.parse('${AppConfig.apiBaseUrl}/donhang/${widget.orderId}/status');
      final resp = await http.get(url, headers: { 'Authorization': 'Bearer $token' });
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body) as Map<String, dynamic>;
        final status = (data['trangthaithanhtoan'] ?? '').toString().toLowerCase();
        return status.contains('da thanh toan');
      }
    } catch (_) {}
    return false;
  }

  Future<void> _openPayment() async {
    final uri = Uri.tryParse(widget.qrOrPayUrl);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _showCancelOrChangeDialog() async {
    if (_prompted) return;
    _prompted = true;
    if (!mounted) return;
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Huỷ giao dịch MoMo?'),
        content: const Text('Bạn đã huỷ trên MoMo? Chọn hành động tiếp theo.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('continue'),
            child: const Text('Tiếp tục chờ'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('cancel'),
            child: const Text('Huỷ'),
          ),
        ],
      ),
    );

    if (!mounted) return;
    if (result == 'cancel') {
      await _completeCancellationFlow();
    } else {
      // continue waiting
      _prompted = false; // allow prompt again later
    }
  }

  Future<void> _onTimeout() async {
    if (_timeoutHandled || _closing) return;
    _timeoutHandled = true;
    // 1) Check lần cuối qua status endpoint (IPN đã kịp về chưa?)
    final paidByStatus = await _checkPaidOnce();
    if (paidByStatus) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanh toán thành công qua MoMo')),
      );
      await _clearCheckoutStateLocal();
      Navigator.of(context).pop(true);
      return;
    }

    // 2) Nếu vẫn chưa thấy IPN, thử query trực tiếp MoMo qua /momo/verify
    try {
      final result = await _paymentService.verifyMomoPayment(orderId: widget.orderId);
      if (!mounted) return;
      if (result.paid) {
        final status = result.orderStatus ?? 'Chờ lấy hàng';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đã xác nhận thanh toán từ MoMo (trạng thái: $status)')), 
        );
        await _clearCheckoutStateLocal();
        Navigator.of(context).pop(true);
        return;
      }
    } catch (_) {
      // ignore verify errors here; will ask user next
    }

    if (!mounted) return;
    // 3) Sau khi đã thử cả IPN & verify nhưng vẫn chưa ghi nhận thanh toán,
    //    không tự đổi sang COD mà hỏi lại người dùng.
    await _showCancelOrChangeDialog();
  }

  String get _formattedTime {
    final m = (_remaining ~/ 60).toString().padLeft(2, '0');
    final s = (_remaining % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        await _showCancelOrChangeDialog();
        return false;
      },
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán MoMo'),
        actions: [
          if (kDebugMode)
            IconButton(
              tooltip: 'Giả lập callback',
              icon: const Icon(Icons.bug_report_outlined),
              onPressed: _openSimulator,
            ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              QrImageView(
                data: widget.qrOrPayUrl,
                size: 240,
                backgroundColor: Colors.white,
              ),
              const SizedBox(height: 16),
              const Text(
                'Quét mã bằng ứng dụng MoMo để thanh toán.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              if (!_ipnConfirmed)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Đang chờ xác nhận IPN từ MoMo...',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  ],
                )
              else
                const Text(
                  'IPN đã xác nhận thanh toán thành công.',
                  style: TextStyle(color: Colors.green),
                ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _openPayment,
                child: const Text('Mở app/trang MoMo'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => _showCancelOrChangeDialog(),
                child: const Text('Tôi đã huỷ giao dịch'),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _manualVerify,
                icon: const Icon(Icons.refresh),
                label: const Text('Tôi đã thanh toán – Kiểm tra lại'),
              ),
              const SizedBox(height: 8),
              Text('Thời gian còn lại: $_formattedTime', style: const TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    ));
  }

  Future<void> _openSimulator() async {
    if (!mounted) return;
    final code = await showModalBottomSheet<int>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.green),
              title: const Text('Giả lập thành công (resultCode=0)'),
              onTap: () => Navigator.of(ctx).pop(0),
            ),
            ListTile(
              leading: const Icon(Icons.cancel, color: Colors.orange),
              title: const Text('Giả lập huỷ (resultCode=1006)'),
              onTap: () => Navigator.of(ctx).pop(1006),
            ),
          ],
        ),
      ),
    );
    if (code == null) return;
    // Custom simulation handling with direct status updates
    if (code == 0) {
      await _simulateSuccess();
    } else if (code == 1006) {
      await _completeCancellationFlow();
    }
  }

  Future<void> _completeCancellationFlow() async {
    if (_closing) return;
    _closing = true;
    await _clearCheckoutStateLocal();
    if (!mounted) return;
    Navigator.of(context).pop('cancel');
  }

  Future<void> _simulateSuccess() async {
    // Mark order paid + ready for pickup
    try {
      final service = OrderService();
      final updated = await service.updateOrderStatus(
        widget.orderId,
        paymentStatus: 'Đã thanh toán',
        orderStatus: 'Chờ lấy hàng',
      );
      if (updated == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(service.lastError ?? 'Không cập nhật được trạng thái đơn hàng')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi cập nhật đơn hàng: $e')),
        );
      }
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đặt hàng thành công!')),
      );
      await _clearCheckoutStateLocal();
      Navigator.of(context).pop(true);
    }
  }

  Future<void> _manualVerify() async {
    try {
      final result = await _paymentService.verifyMomoPayment(orderId: widget.orderId);
      if (!mounted) return;
      if (result.paid) {
        _closing = true;
        final status = result.orderStatus ?? 'Chờ lấy hàng';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đã xác nhận thanh toán từ MoMo. Trạng thái đơn: $status')), 
        );
        await _clearCheckoutStateLocal();
        Navigator.of(context).pop(true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_paymentService.lastError ?? 'Chưa ghi nhận thanh toán. Vui lòng chờ 1–2 phút hoặc thử lại.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kiểm tra: $e')),
      );
    }
  }
}