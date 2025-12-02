import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/cart_model.dart';
import '../models/product_model.dart';
import '../services/api_client.dart';
import '../services/cart_service.dart';
import '../services/product_service.dart';
import 'checkout_screen.dart';

const Color kPrimaryBlue = Color(0xFF00B4D8);

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();
  final ProductService _productService = ProductService(ApiClient());
  final NumberFormat _priceFormatter = NumberFormat.decimalPattern('vi_VN');
  Cart? _cart;
  bool _isLoading = true;
  Set<int> _selectedItemIds = {}; // Track selected items for checkout

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload cart when screen becomes active (e.g., when navigating back)
    if (mounted) {
      _loadCart();
    }
  }

  Future<void> _loadCart() async {
    setState(() => _isLoading = true);
    try {
      print('[CartScreen] Loading cart...');
      final cart = await _cartService.getCart();
      print(
          '[CartScreen] Cart loaded: ${cart.items.length} items, total: ${cart.total}');
      if (mounted) {
        setState(() {
          _cart = cart;
          _isLoading = false;
          // Auto-select all items when cart loads
          _selectedItemIds = cart.items.map((item) => item.id).toSet();
        });
      }
    } catch (e) {
      debugPrint('Error loading cart: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _updateQuantity(CartItem item, int newQuantity) async {
    if (newQuantity < 1) return;

    final success = await _cartService.updateQuantity(item.id, newQuantity);
    if (success) {
      _loadCart();
    }
  }

  Future<void> _removeItem(CartItem item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận'),
        content: const Text('Bạn có chắc muốn xóa sản phẩm này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await _cartService.removeFromCart(item.id);
      if (success) {
        _loadCart();
      }
    }
  }

  static const _supabaseProjectRef = 'ergnrfsqzghjseovmzkg';

  String _buildImageUrl(String? path) {
    if (path == null || path.isEmpty) {
      return 'https://via.placeholder.com/80';
    }
    if (path.startsWith('http')) {
      return path;
    }
    return 'https://$_supabaseProjectRef.supabase.co/storage/v1/object/public/$path';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Giỏ hàng'),
        elevation: 1,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _cart == null || _cart!.isEmpty
              ? _buildEmptyCart()
              : _buildCartList(),
      bottomNavigationBar:
          _cart != null && _cart!.isNotEmpty ? _buildBottomBar() : null,
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_cart_outlined,
            size: 100,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            'Giỏ hàng trống',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00B4D8),
              padding: const EdgeInsets.symmetric(
                horizontal: 32,
                vertical: 12,
              ),
            ),
            child: const Text(
              'Tiếp tục mua sắm',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    return RefreshIndicator(
      onRefresh: _loadCart,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _cart!.items.length,
        separatorBuilder: (context, index) => const Divider(height: 24),
        itemBuilder: (context, index) {
          final item = _cart!.items[index];
          return _buildCartItem(item);
        },
      ),
    );
  }

  Widget _buildCartItem(CartItem item) {
    final isSelected = _selectedItemIds.contains(item.id);
    final showGift = item.hasGiftPromotion;

    return Dismissible(
      key: Key('cart_${item.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (direction) => _removeItem(item),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Checkbox
          Checkbox(
            value: isSelected,
            onChanged: (bool? value) {
              setState(() {
                if (value == true) {
                  _selectedItemIds.add(item.id);
                } else {
                  _selectedItemIds.remove(item.id);
                }
              });
            },
            activeColor: const Color(0xFF00B4D8),
          ),

          // Product Image
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                _buildImageUrl(item.imageUrl),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey[200],
                  child: const Icon(Icons.image, color: Colors.grey),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.displayName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                _VariantTag(
                  label: item.displayVariant.isNotEmpty
                      ? item.displayVariant
                      : 'Chọn phân loại',
                  onTap: () => _showVariantSelector(item),
                ),
                if (showGift)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: _buildGiftInfo(item),
                  ),
                const SizedBox(height: 6),
                _buildPriceForCartItem(item),
              ],
            ),
          ),

          // Quantity Controls
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    _quantityButton(
                      icon: Icons.remove,
                      onPressed: () => _updateQuantity(item, item.quantity - 1),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                    _quantityButton(
                      icon: Icons.add,
                      onPressed: () => _updateQuantity(item, item.quantity + 1),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20),
                color: Colors.grey[600],
                onPressed: () => _removeItem(item),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceForCartItem(CartItem item) {
    final hasDiscount = item.hasPercentDiscount;
    final original = item.displayOriginalPrice;
    final finalPrice = item.displayFinalPrice;

    if (!hasDiscount) {
      return Text(
        '${_priceFormatter.format(finalPrice)}đ',
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.red,
        ),
      );
    }

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6,
      runSpacing: 4,
      children: [
        Text(
          '${_priceFormatter.format(original)}đ',
          style: const TextStyle(
            fontSize: 13,
            decoration: TextDecoration.lineThrough,
            color: Color(0xFF0F6BA8),
          ),
        ),
        Text(
          '${_priceFormatter.format(finalPrice)}đ',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.red,
          ),
        ),
        if (item.discountPercentText != null)
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFFFEBEE),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '-${item.discountPercentText}',
              style: const TextStyle(
                fontSize: 11,
                color: Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildGiftInfo(CartItem item) {
    final gift = item.resolvedGiftProduct;
    if (gift == null) return const SizedBox.shrink();

    final giftName = gift.name.isNotEmpty ? gift.name : 'Sản phẩm tặng kèm';
    final giftVariant = gift.variantLabel;
    final promoLabel = item.promotionLabel ??
        (item.isBuyXGetYPromotion ? 'Mua 1 tặng 1' : 'Quà tặng');
    final giftImageUrl = _buildImageUrl(gift.imageUrl);

    final screenWidth = MediaQuery.of(context).size.width;
    final maxGiftCardWidth = screenWidth - 32;
    final canChangeGift = item.hasGiftOptions;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF2E0),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.card_giftcard, size: 18, color: Color(0xFFFB8C00)),
              SizedBox(width: 8),
              Text(
                'Đã chọn 1 quà tặng',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFFFB8C00),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerLeft,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: maxGiftCardWidth,
            ),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFFFFFBF5),
                    Color(0xFFFFF2E0),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFFD7A8), width: 1.3),
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.12),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          giftImageUrl,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 80,
                            height: 80,
                            color: Colors.grey[200],
                            alignment: Alignment.center,
                            child: const Icon(Icons.image, color: Colors.grey),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF0DA),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'Quà $promoLabel',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFFB8C00),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              giftName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (giftVariant != null && giftVariant.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Colors.orange[200]!,
                                  ),
                                ),
                                child: Text(
                                  giftVariant,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.orange[900],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.red[100]!),
                        ),
                        child: const Text(
                          'Free',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                        ),
                      ),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: kPrimaryBlue,
                          side: BorderSide(
                            color: kPrimaryBlue.withOpacity(0.4),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          minimumSize: const Size(0, 34),
                        ),
                        onPressed:
                            canChangeGift ? () => _showGiftSelector(item) : null,
                        icon: const Icon(Icons.swap_horiz, size: 16),
                        label: const Text(
                          'Thay đổi',
                          style: TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _showGiftSelector(CartItem item) async {
    if (item.giftOptions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sản phẩm này không có quà tặng khác')),
      );
      return;
    }

    String optionKey(CartGiftOption option) =>
        '${option.variantId}_${option.sizeBridgeId ?? 'null'}';

    CartGiftOption currentSelection = item.giftOptions.firstWhere(
      (opt) =>
          opt.variantId == item.selectedGiftVariantId &&
          (opt.sizeBridgeId ?? -1) ==
              (item.selectedGiftSizeBridgeId ?? opt.sizeBridgeId ?? -1),
      orElse: () => item.giftOptions.first,
    );
    String currentKey = optionKey(currentSelection);

    final CartGiftOption? picked =
        await showModalBottomSheet<CartGiftOption?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return _VariantSelectorContainer(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const Text(
                    'Chọn quà tặng',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 400),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: item.giftOptions.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final option = item.giftOptions[index];
                        final key = optionKey(option);
                        return RadioListTile<String>(
                          value: key,
                          groupValue: currentKey,
                          contentPadding: EdgeInsets.zero,
                          onChanged: (_) {
                            setModalState(() {
                              currentKey = key;
                              currentSelection = option;
                            });
                          },
                          title: Text(
                            option.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (option.label != null &&
                                  option.label!.isNotEmpty)
                                Text(option.label!),
                              if (option.promoLabel != null &&
                                  option.promoLabel!.isNotEmpty)
                                Text(
                                  option.promoLabel!,
                                  style: const TextStyle(
                                    color: Color(0xFFFB8C00),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                            ],
                          ),
                          secondary: option.imageUrl != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.network(
                                    _buildImageUrl(option.imageUrl),
                                    width: 56,
                                    height: 56,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : null,
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () =>
                          Navigator.pop(context, currentSelection),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimaryBlue,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Xác nhận',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (picked == null) return;

    final success = await _cartService.updateGiftSelection(
      itemId: item.id,
      variantId: picked.variantId,
      sizeBridgeId: picked.sizeBridgeId,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã cập nhật quà tặng')),
      );
      _loadCart();
    } else {
      final message =
          _cartService.lastError ?? 'Không thể cập nhật quà tặng, vui lòng thử lại';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  Future<void> _showVariantSelector(CartItem item) async {
    final future =
        _productService.getProductWithVariantByVariantId(item.variantId);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return FutureBuilder<ProductWithVariant?>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const _VariantSelectorContainer(
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return _VariantSelectorContainer(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(height: 8),
                      Text(
                        'Không thể tải thông tin phân loại',
                        style: TextStyle(color: Colors.grey[700]),
                      ),
                    ],
                  ),
                ),
              );
            }

            final product = snapshot.data!.product;
            ProductVariant tempSelectedVariant = snapshot.data!.variant;
            VariantSize? tempSelectedSize;
            if (tempSelectedVariant.sizes.isNotEmpty) {
              tempSelectedSize = tempSelectedVariant.sizes.firstWhere(
                (s) => s.id == item.sizeBridgeId,
                orElse: () => tempSelectedVariant.sizes.first,
              );
            }

            return StatefulBuilder(
              builder: (context, setModalState) {
                void selectVariant(ProductVariant variant) {
                  setModalState(() {
                    tempSelectedVariant = variant;
                    tempSelectedSize = variant.sizes.isNotEmpty
                        ? variant.sizes.first
                        : null;
                  });
                }

                void selectSize(VariantSize size) {
                  setModalState(() {
                    tempSelectedSize = size;
                  });
                }

                return _VariantSelectorContainer(
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          height: 4,
                          width: 40,
                          margin: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Chọn màu/phân loại',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 110,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: product.variants.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (context, index) {
                              final variant = product.variants[index];
                              final selected =
                                  variant.id == tempSelectedVariant.id;
                              final imageUrl = variant.images.isNotEmpty
                                  ? variant.images.first.url
                                  : product.coverImage;
                              return GestureDetector(
                                onTap: () => selectVariant(variant),
                                child: Container(
                                  width: 90,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: selected
                                          ? kPrimaryBlue
                                          : Colors.grey[300]!,
                                      width: selected ? 2 : 1,
                                    ),
                                  ),
                                  child: Column(
                                    children: [
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius:
                                              const BorderRadius.vertical(
                                                  top: Radius.circular(8)),
                                          child: Image.network(
                                            _buildImageUrl(imageUrl),
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) =>
                                                Container(
                                              color: Colors.grey[200],
                                              alignment: Alignment.center,
                                              child: const Icon(Icons.image,
                                                  color: Colors.grey),
                                            ),
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.all(6),
                                        child: Text(
                                          variant.color ??
                                              variant.displayName ??
                                              'Phân loại',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: selected
                                                ? FontWeight.w600
                                                : FontWeight.normal,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (tempSelectedVariant.sizes.isNotEmpty) ...[
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Chọn size',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[700],
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: tempSelectedVariant.sizes.map((size) {
                              final disabled = size.stock <= 0;
                              final selected =
                                  tempSelectedSize?.id == size.id;
                              return ChoiceChip(
                                label: Text(size.name),
                                selected: selected,
                                onSelected: disabled
                                    ? null
                                    : (_) => selectSize(size),
                                selectedColor: kPrimaryBlue,
                                labelStyle: TextStyle(
                                  color: disabled
                                      ? Colors.grey
                                      : (selected
                                          ? Colors.white
                                          : Colors.black87),
                                  fontWeight: selected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _changeVariantForCartItem(
                                item,
                                tempSelectedVariant,
                                tempSelectedSize,
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kPrimaryBlue,
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text(
                              'Áp dụng phân loại',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Future<void> _changeVariantForCartItem(
    CartItem item,
    ProductVariant variant,
    VariantSize? size,
  ) async {
    final added = await _cartService.addToCart(
      variantId: variant.id,
      price: variant.price,
      quantity: item.quantity,
      sizeBridgeId: size?.id,
    );

    if (!added) {
      _showSnack(_cartService.lastError ?? 'Không thể đổi phân loại');
      return;
    }

    await _cartService.removeFromCart(item.id);
    _showSnack(
      'Đã cập nhật phân loại',
      bgColor: Colors.green,
    );
    _loadCart();
  }

  Widget _quantityButton(
      {required IconData icon, required VoidCallback onPressed}) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(4),
        child: Icon(icon, size: 16),
      ),
    );
  }

  void _showSnack(String message, {Color bgColor = Colors.red}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: bgColor,
      ),
    );
  }

  Widget _buildBottomBar() {
    // Calculate total for selected items only
    final selectedItems =
        _cart!.items.where((item) => _selectedItemIds.contains(item.id));
    final selectedTotal = selectedItems.fold<double>(
        0, (sum, item) => sum + (item.price * item.quantity));
    final selectedCount = selectedItems.length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Select all checkbox
            Row(
              children: [
                Checkbox(
                  value: _selectedItemIds.length == _cart!.items.length,
                  onChanged: (bool? value) {
                    setState(() {
                      if (value == true) {
                        _selectedItemIds =
                            _cart!.items.map((item) => item.id).toSet();
                      } else {
                        _selectedItemIds.clear();
                      }
                    });
                  },
                  activeColor: const Color(0xFF00B4D8),
                ),
                const Text(
                  'Chọn tất cả',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tổng cộng:',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${selectedTotal.toStringAsFixed(0)}đ',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: selectedCount == 0
                    ? null
                    : () {
                        // Check if any selected item is out of stock
                        final selectedItems = _cart!.items
                            .where((item) => _selectedItemIds.contains(item.id))
                            .toList();

                        final outOfStockItems = selectedItems
                            .where((item) =>
                                item.variant != null &&
                                item.variant!.stock <= 0)
                            .toList();

                        if (outOfStockItems.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                outOfStockItems.length == 1
                                    ? 'Sản phẩm "${outOfStockItems.first.variant?.product?.name ?? 'này'}" đã hết hàng'
                                    : '${outOfStockItems.length} sản phẩm đã hết hàng',
                              ),
                              backgroundColor: Colors.red,
                              action: SnackBarAction(
                                label: 'Xóa',
                                textColor: Colors.white,
                                onPressed: () {
                                  // Remove out of stock items from selection
                                  setState(() {
                                    for (var item in outOfStockItems) {
                                      _selectedItemIds.remove(item.id);
                                    }
                                  });
                                },
                              ),
                            ),
                          );
                          return;
                        }

                        // Check if any selected item quantity exceeds stock
                        final insufficientStockItems = selectedItems
                            .where((item) =>
                                item.variant != null &&
                                item.quantity > item.variant!.stock)
                            .toList();

                        if (insufficientStockItems.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                insufficientStockItems.length == 1
                                    ? 'Sản phẩm "${insufficientStockItems.first.variant?.product?.name ?? 'này'}" chỉ còn ${insufficientStockItems.first.variant?.stock ?? 0} trong kho'
                                    : 'Một số sản phẩm có số lượng vượt quá tồn kho',
                              ),
                              backgroundColor: Colors.orange,
                            ),
                          );
                          return;
                        }

                        // Navigate to checkout screen with only selected items
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CheckoutScreen(
                              source: CheckoutSource.cart,
                              selectedItemIds: _selectedItemIds.toList(),
                            ),
                          ),
                        ).then((_) {
                          // Reload cart after returning from checkout
                          _loadCart();
                        });
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00B4D8),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  disabledBackgroundColor: Colors.grey[300],
                ),
                child: Text(
                  selectedCount == 0
                      ? 'Chọn sản phẩm để thanh toán'
                      : 'Thanh toán ($selectedCount sản phẩm)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: selectedCount == 0 ? Colors.grey[600] : Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VariantSelectorContainer extends StatelessWidget {
  final Widget child;

  const _VariantSelectorContainer({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: child,
        ),
      ),
    );
  }
}

class _VariantTag extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _VariantTag({
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome_mosaic,
                size: 14, color: Colors.grey[600]),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down,
                size: 16, color: Colors.grey[600]),
          ],
        ),
      ),
    );
  }
}