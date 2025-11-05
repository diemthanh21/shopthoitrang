import 'package:flutter/material.dart';
import '../models/cart_model.dart';
import '../services/cart_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();
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
                if (item.displayVariant.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.displayVariant,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  '${item.price.toStringAsFixed(0)}đ',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
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
