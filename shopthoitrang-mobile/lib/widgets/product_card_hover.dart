// lib/widgets/product_card_hover.dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/product_model.dart';

/// Card sản phẩm: có 2 nút < >
class ProductCard extends StatefulWidget {
  final Product product;
  final void Function()? onTap;
  final String Function(String relativePath)? buildImageUrl;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.buildImageUrl,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  int _index = 0;
  late final List<String> _urls;

  @override
  void initState() {
    super.initState();
    _urls = widget.product.allImages
        .map((e) =>
            widget.buildImageUrl != null ? widget.buildImageUrl!(e.url) : e.url)
        .where((u) => u.isNotEmpty)
        .toList();
    if (_urls.isEmpty) {
      _urls.add('https://picsum.photos/seed/${widget.product.id}/600/600');
    }
  }

  void _prev() =>
      setState(() => _index = (_index - 1 + _urls.length) % _urls.length);
  void _next() => setState(() => _index = (_index + 1) % _urls.length);

  @override
  Widget build(BuildContext context) {
    final url = _urls[_index];
    final price = widget.product.minPrice;
    final hasMany = _urls.length > 1;

    return InkWell(
      onTap: widget.onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: Image.network(
                      url,
                      key: ValueKey(url),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.broken_image)),
                    ),
                  ),
                ),

                // Nút < >
                if (hasMany) ...[
                  Positioned(
                    left: 6,
                    top: 0,
                    bottom: 0,
                    child: _roundBtn(icon: Icons.chevron_left, onTap: _prev),
                  ),
                  Positioned(
                    right: 6,
                    top: 0,
                    bottom: 0,
                    child: _roundBtn(icon: Icons.chevron_right, onTap: _next),
                  ),
                  Positioned(
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${_index + 1}/${_urls.length}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.product.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          if (price != null)
            Text('${price.toStringAsFixed(0)}đ',
                style: TextStyle(color: Colors.grey[800])),
        ],
      ),
    );
  }

  Widget _roundBtn({required IconData icon, required VoidCallback onTap}) {
    return Center(
      child: Material(
        color: Colors.black45,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: const Padding(
            padding: EdgeInsets.all(6),
            child: Icon(Icons.chevron_left, color: Colors.white, size: 22),
          ),
        ),
      ),
    ).build(context, icon, onTap);
  }
}

// trick nhỏ để đổi icon trái/phải (vì _roundBtn dùng chevron_left)
extension on Widget {
  Widget build(BuildContext context, IconData icon, VoidCallback onTap) {
    if (icon == Icons.chevron_right) {
      return Transform.flip(flipX: true, child: this);
    }
    return this;
  }
}
