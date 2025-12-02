import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SepayCheckoutScreen extends StatefulWidget {
  const SepayCheckoutScreen({
    super.key,
    this.initialHtml,
    this.initialUrl,
    this.fallbackUrl,
  });

  final String? initialHtml;
  final String? initialUrl;
  final String? fallbackUrl;

  @override
  State<SepayCheckoutScreen> createState() => _SepayCheckoutScreenState();
}

class _SepayCheckoutScreenState extends State<SepayCheckoutScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _isLoading = true),
          onPageFinished: (_) => setState(() => _isLoading = false),
          onWebResourceError: (error) {
            if (!mounted) return;
            final snackBar = SnackBar(
              content: Text(
                'Không thể tải trang thanh toán: ${error.description}',
              ),
            );
            ScaffoldMessenger.of(context).showSnackBar(snackBar);
          },
        ),
      );

    if (widget.initialHtml != null && widget.initialHtml!.isNotEmpty) {
      _controller.loadHtmlString(widget.initialHtml!);
    } else if (widget.initialUrl != null && widget.initialUrl!.isNotEmpty) {
      final uri = Uri.tryParse(widget.initialUrl!);
      if (uri != null) {
        _controller.loadRequest(uri);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán SePay'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller.reload(),
          ),
          if (widget.fallbackUrl != null)
            IconButton(
              icon: const Icon(Icons.open_in_new),
              tooltip: 'Mở trình duyệt',
              onPressed: _openFallback,
            ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const LinearProgressIndicator(minHeight: 2),
        ],
      ),
    );
  }

  Future<void> _openFallback() async {
    final fallback = widget.fallbackUrl;
    if (fallback == null) return;
    final uri = Uri.tryParse(fallback);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể mở trình duyệt.')),
      );
    }
  }
}
