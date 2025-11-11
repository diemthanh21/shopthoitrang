import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/review_model.dart';
import '../services/review_service.dart';
import '../services/product_service.dart';
import '../services/api_client.dart';
import '../models/product_model.dart';

class ProductReviewsScreen extends StatefulWidget {
  final int productId;
  final String productName;

  const ProductReviewsScreen({
    super.key,
    required this.productId,
    required this.productName,
  });

  @override
  State<ProductReviewsScreen> createState() => _ProductReviewsScreenState();
}

class _ProductReviewsScreenState extends State<ProductReviewsScreen> {
  bool _isLoading = false;
  List<Review> _reviews = [];
  String? _errorMessage;
  Product? _product;

  // Filters
  String _selectedFilter = 'Tất cả';
  final List<String> _filters = ['Tất cả', 'Có hình ảnh', 'Sao ⭐', '1 Sao'];

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    // Load product (for image/name fallback) and reviews in parallel
    setState(() => _isLoading = true);
    await Future.wait([
      _loadProduct(),
      _loadReviews(),
    ]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadProduct() async {
    try {
      final svc = ProductService(ApiClient());
      final p = await svc.getByIdWithImages(widget.productId);
      if (mounted) setState(() => _product = p);
    } catch (e) {
      // ignore product load errors; we still show reviews
      debugPrint('Load product failed: $e');
    }
  }

  Future<void> _loadReviews() async {
    // If already in global loading (initial), don't override _isLoading here
    if (!_isLoading) setState(() => _isLoading = true);
    _errorMessage = null;

    try {
      final reviews =
          await reviewService.getReviews(productId: widget.productId);

      if (reviews != null) {
        if (mounted) setState(() => _reviews = reviews);
      } else {
        if (mounted)
          setState(() => _errorMessage =
              reviewService.lastError ?? 'Lỗi khi tải đánh giá');
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  List<Review> get _filteredReviews {
    if (_selectedFilter == 'Tất cả') return _reviews;
    if (_selectedFilter == 'Có hình ảnh') {
      return _reviews
          .where((r) => r.images != null && r.images!.isNotEmpty)
          .toList();
    }
    if (_selectedFilter == 'Sao ⭐') {
      return _reviews.where((r) => r.rating == 5).toList();
    }
    if (_selectedFilter == '1 Sao') {
      return _reviews.where((r) => r.rating == 1).toList();
    }
    return _reviews;
  }

  double get _averageRating {
    if (_reviews.isEmpty) return 0;
    final sum = _reviews.fold<int>(0, (prev, r) => prev + r.rating);
    return sum / _reviews.length;
  }

  Map<int, int> get _ratingDistribution {
    final dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    for (var review in _reviews) {
      dist[review.rating] = (dist[review.rating] ?? 0) + 1;
    }
    return dist;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Đánh giá',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!,
                          style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadReviews,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadReviews,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Summary card
                        _buildSummaryCard(),

                        const SizedBox(height: 8),

                        // Filter tabs
                        _buildFilterTabs(),

                        const SizedBox(height: 8),

                        // Reviews list
                        _buildReviewsList(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          // Overall rating
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _averageRating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const Text(
                ' /5',
                style: TextStyle(fontSize: 20, color: Colors.grey),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Star rating
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              return Icon(
                index < _averageRating.round() ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 24,
              );
            }),
          ),

          const SizedBox(height: 8),

          Text(
            '${_reviews.length} đánh giá',
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),

          const SizedBox(height: 16),

          // Rating distribution
          ..._ratingDistribution.entries.toList().reversed.map((entry) {
            final star = entry.key;
            final count = entry.value;
            final percentage = _reviews.isEmpty ? 0.0 : count / _reviews.length;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 60,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('$star', style: const TextStyle(fontSize: 13)),
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: percentage,
                        backgroundColor: Colors.grey[200],
                        valueColor: const AlwaysStoppedAnimation(Colors.amber),
                        minHeight: 8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 30,
                    child: Text(
                      '$count',
                      textAlign: TextAlign.right,
                      style: const TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _filters.map((filter) {
            final isSelected = _selectedFilter == filter;
            int count = 0;

            if (filter == 'Tất cả') {
              count = _reviews.length;
            } else if (filter == 'Có hình ảnh') {
              count = _reviews
                  .where((r) => r.images != null && r.images!.isNotEmpty)
                  .length;
            } else if (filter == 'Sao ⭐') {
              count = _reviews.where((r) => r.rating == 5).length;
            } else if (filter == '1 Sao') {
              count = _reviews.where((r) => r.rating == 1).length;
            }

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text('$filter ($count)'),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _selectedFilter = filter);
                  }
                },
                selectedColor: const Color(0xFFEE4D2D).withOpacity(0.1),
                labelStyle: TextStyle(
                  color: isSelected ? const Color(0xFFEE4D2D) : Colors.black87,
                  fontSize: 13,
                ),
                side: BorderSide(
                  color:
                      isSelected ? const Color(0xFFEE4D2D) : Colors.grey[300]!,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildReviewsList() {
    final filtered = _filteredReviews;

    if (filtered.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        color: Colors.white,
        child: const Center(
          child: Text('Chưa có đánh giá nào',
              style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    return Container(
      color: Colors.white,
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: filtered.length,
        separatorBuilder: (_, __) =>
            Divider(height: 1, color: Colors.grey[200]),
        itemBuilder: (context, index) {
          return _buildReviewItem(filtered[index]);
        },
      ),
    );
  }

  Widget _buildReviewItem(Review review) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final imageUrls = review.imageList;
    final displayCustomerName = review.customerName?.trim().isNotEmpty == true
        ? review.customerName!.trim()
        : 'KH #${review.customerId}';
    // Determine product display name
    final displayProductName = review.productName?.trim().isNotEmpty == true
        ? review.productName!.trim()
        : _product?.name ?? widget.productName;
    // Choose image: variant > product > product first variant image
    String? imageUrl = review.variantImage ?? review.productImage;
    if (imageUrl == null && _product != null) {
      if (_product!.variants.isNotEmpty &&
          _product!.variants.first.images.isNotEmpty) {
        imageUrl = _product!.variants.first.images.first.url;
      }
    }

    String _buildImageUrl(String? raw) {
      if (raw == null || raw.isEmpty) return '';
      if (raw.startsWith('http')) return raw;
      // Supabase public storage path fallback (adjust project ref if needed)
      const projectRef = 'ergnrfsqzghjseovmzkg';
      return 'https://$projectRef.supabase.co/storage/v1/object/public/$raw';
    }

    final resolvedImage = _buildImageUrl(imageUrl);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info
          // User + date
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.grey[300],
                backgroundImage: (review.customerImage != null &&
                        review.customerImage!.isNotEmpty)
                    ? NetworkImage(_buildImageUrl(review.customerImage))
                    : null,
                child: (review.customerImage == null ||
                        review.customerImage!.isEmpty)
                    ? Text(
                        displayCustomerName.substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: Colors.white),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayCustomerName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    if (review.reviewDate != null)
                      Text(
                        dateFormat.format(review.reviewDate!),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Star rating + product purchased info block
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: resolvedImage.isNotEmpty
                      ? Image.network(
                          resolvedImage,
                          width: 54,
                          height: 54,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 54,
                            height: 54,
                            color: Colors.grey[200],
                            child: const Icon(Icons.image_not_supported,
                                size: 24, color: Colors.grey),
                          ),
                        )
                      : Container(
                          width: 54,
                          height: 54,
                          color: Colors.grey[200],
                          child: const Icon(Icons.image_not_supported,
                              size: 24, color: Colors.grey),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product name
                      Text(
                        displayProductName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Stars
                      Row(
                        children: List.generate(5, (index) {
                          return Icon(
                            index < review.rating
                                ? Icons.star
                                : Icons.star_border,
                            color: Colors.amber,
                            size: 14,
                          );
                        }),
                      ),
                      const SizedBox(height: 4),
                      // Variant classification text (color + size combined)
                      Builder(builder: (context) {
                        final hasColor = review.variantColor != null &&
                            review.variantColor!.trim().isNotEmpty;
                        final hasSize = review.variantSize != null &&
                            review.variantSize!.trim().isNotEmpty;
                        if (!hasColor && !hasSize)
                          return const SizedBox(height: 0);
                        final parts = <String>[];
                        if (hasColor) parts.add('Màu: ${review.variantColor}');
                        if (hasSize) parts.add('Size: ${review.variantSize}');
                        return Text(
                          'Phân loại: ${parts.join(' • ')}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[700],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Comment
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.comment!,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
                height: 1.4,
              ),
            ),
          ],

          // Images
          if (imageUrls.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: imageUrls.take(4).map((url) {
                return GestureDetector(
                  onTap: () =>
                      _showImageDialog(imageUrls, imageUrls.indexOf(url)),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.network(
                      url,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey[200],
                        child:
                            const Icon(Icons.broken_image, color: Colors.grey),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],

          // Shop reply
          if (review.shopReply != null && review.shopReply!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.store, size: 16, color: Colors.grey[700]),
                      const SizedBox(width: 4),
                      Text(
                        'Phản hồi từ Shop',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    review.shopReply!,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[800],
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showImageDialog(List<String> images, int initialIndex) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            PageView.builder(
              itemCount: images.length,
              controller: PageController(initialPage: initialIndex),
              itemBuilder: (context, index) {
                return InteractiveViewer(
                  child: Image.network(
                    images[index],
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Icon(Icons.broken_image,
                          color: Colors.white, size: 64),
                    ),
                  ),
                );
              },
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // kept previously for chip-style metadata; not used now after switching to text line
}
