import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/product_model.dart';

/// ProductGalleryCard
/// - Hiển thị slider ảnh (auto-play trên web/desktop hover, hoặc tự động nếu autoPlay=true)
/// - Vuốt ngang đổi ảnh trên mobile
/// - Có indicators dạng chấm + counter
/// - Fallback placeholder nếu không có ảnh
class ProductGalleryCard extends StatefulWidget {
  final Product product;
  final void Function()? onTap;
  final String Function(String relativePath)? buildImageUrl;
  final bool autoPlay; // mobile mặc định false để tiết kiệm tài nguyên
  final Duration interval;
  final bool showCounter;
  final bool showDots;
  final double borderRadius;
  final EdgeInsetsGeometry padding;

  const ProductGalleryCard({
    super.key,
    required this.product,
    this.onTap,
    this.buildImageUrl,
    this.autoPlay = false,
    this.interval = const Duration(seconds: 2),
    this.showCounter = true,
    this.showDots = true,
    this.borderRadius = 10,
    this.padding = EdgeInsets.zero,
  });

  @override
  State<ProductGalleryCard> createState() => _ProductGalleryCardState();
}

class _ProductGalleryCardState extends State<ProductGalleryCard> {
  final _pageCtrl = PageController();
  Timer? _timer;
  int _index = 0;
  late List<String> _urls;

  bool get _isWebLike =>
      kIsWeb ||
      [
        TargetPlatform.macOS,
        TargetPlatform.windows,
        TargetPlatform.linux,
      ].contains(defaultTargetPlatform);

  @override
  void initState() {
    super.initState();
    _urls = widget.product
        .galleryImageUrls()
        .map((u) => widget.buildImageUrl != null ? widget.buildImageUrl!(u) : u)
        .where((u) => u.isNotEmpty)
        .toList();
    if (_urls.isEmpty) {
      _urls = ['https://picsum.photos/seed/${widget.product.id}/600/600'];
    }
    if (widget.autoPlay && _urls.length > 1) {
      _startAuto();
    }
  }

  void _startAuto() {
    _timer?.cancel();
    _timer = Timer.periodic(widget.interval, (_) {
      if (!mounted) return;
      if (_urls.length <= 1) return;
      _index = (_index + 1) % _urls.length;
      _pageCtrl.animateToPage(
        _index,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
      );
    });
  }

  void _stopAuto() {
    _timer?.cancel();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final price = widget.product.minPrice;

    Widget slider = ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageCtrl,
            physics: const BouncingScrollPhysics(),
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: _urls.length,
            itemBuilder: (_, i) {
              final url = _urls[i];
              return Image.network(
                url,
                fit: BoxFit.cover,
                loadingBuilder: (c, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    color: Colors.grey[200],
                    child: const Center(
                        child: CircularProgressIndicator(strokeWidth: 2)),
                  );
                },
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[300],
                  child: const Icon(Icons.image_not_supported),
                ),
              );
            },
          ),
          if (widget.showCounter && _urls.length > 1)
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${_index + 1}/${_urls.length}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ),
          if (widget.showDots && _urls.length > 1)
            Positioned(
              bottom: 6,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _urls.length,
                  (i) => Container(
                    width: 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: i == _index ? Colors.white : Colors.white38,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    // Hover auto-play (web/desktop)
    if (_isWebLike) {
      slider = MouseRegion(
        onEnter: (_) {
          if (_urls.length > 1) _startAuto();
        },
        onExit: (_) => _stopAuto(),
        child: slider,
      );
    } else if (_urls.length > 1) {
      // Mobile: tap nhanh chuyển ảnh
      slider = GestureDetector(
        onHorizontalDragEnd: (d) {
          if (d.primaryVelocity == null) return;
          if (d.primaryVelocity! < 0) {
            final next = (_index + 1) % _urls.length;
            _pageCtrl.animateToPage(next,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut);
          } else {
            final prev = (_index - 1 + _urls.length) % _urls.length;
            _pageCtrl.animateToPage(prev,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut);
          }
        },
        child: slider,
      );
    }

    return InkWell(
      onTap: widget.onTap,
      child: Padding(
        padding: widget.padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(aspectRatio: 1, child: slider),
            const SizedBox(height: 8),
            Text(
              widget.product.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            if (price != null)
              Text(
                '${price.toStringAsFixed(0)}đ',
                style: TextStyle(color: Colors.grey[800]),
              ),
          ],
        ),
      ),
    );
  }
}
