import 'dart:async';
import 'package:flutter/material.dart';

import '../services/banner_service.dart';
import '../services/cart_service.dart';
import '../models/banner_model.dart';
import '../services/api_client.dart';
import 'profile_screen.dart';
import 'cart_screen.dart';
import 'orders_screen.dart';
import 'chat_screen.dart';
import '../services/chat_service.dart';
import 'login_screen.dart';
import 'product_list_screen.dart';
import 'notification_screen.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

// ================================================================================

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  final CartService _cartService = CartService();
  int _cartItemCount = 0;

  @override
  void initState() {
    super.initState();
    _loadCartCount();
  }

  Future<void> _loadCartCount() async {
    try {
      final cart = await _cartService.getCart();
      if (mounted) {
        setState(() {
          _cartItemCount = cart.itemCount;
        });
      }
    } catch (e) {
      debugPrint('Error loading cart count: $e');
    }
  }

  void _navigateToCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CartScreen()),
    ).then((_) => _loadCartCount());
  }

  Future<void> _openChat() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      final goLogin = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Cần đăng nhập'),
          content: const Text('Bạn cần đăng nhập để trao đổi với nhân viên.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Để sau')),
            ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Đăng nhập')),
          ],
        ),
      );
      if (goLogin == true && mounted) {
        await Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const LoginScreen()));
      }
      return;
    }
    if (!mounted) return;
    try {
      final svc = ChatService();
      final box = await svc.startChat();
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
            builder: (_) => ChatScreen(
                chatBox: box)), // product null => không gửi thẻ sản phẩm
      );
    } catch (e) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Lỗi'),
          content: Text('Không thể mở chat: $e'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx), child: const Text('Đóng'))
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.4,
        centerTitle: false,
        titleSpacing: 12,
        title: Row(
          children: const [
            Icon(Icons.verified, color: Colors.blueAccent),
            SizedBox(width: 8),
            Text(
              'ELORA',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w700,
                letterSpacing: .5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            tooltip: 'Nhắn tin',
            onPressed: _openChat,
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined),
                onPressed: _navigateToCart,
              ),
              if (_cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      _cartItemCount > 99 ? '99+' : '$_cartItemCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const _HomeTab(),
          const ProductListScreen(),
          const NotificationScreen(),
          const OrdersScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.black87,
        unselectedItemColor: Colors.black54,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined), label: 'Trang chủ'),
          BottomNavigationBarItem(
              icon: Icon(Icons.shopping_bag_outlined), label: 'Sản phẩm'),
          BottomNavigationBarItem(
              icon: Icon(Icons.notifications_outlined), label: 'Thông báo'),
          BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined), label: 'Đơn hàng'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline), label: 'Tài khoản'),
        ],
      ),
    );
  }
}

/// ====== TAB TRANG CHỦ - CHỈ HIỂN THỊ BANNER ======
class _HomeTab extends StatefulWidget {
  const _HomeTab();

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  final _pageCtrl = PageController();
  int _page = 0;
  Timer? _autoPlayTimer;

  late final BannerService _bannerService;
  List<BannerModel> _banners = [];
  bool _loadingBanner = true;
  String? _errBanner;

  @override
  void initState() {
    super.initState();
    final api = ApiClient();
    _bannerService = BannerService(api);
    _loadBanners();
    _startAutoPlay();
  }

  void _startAutoPlay() {
    _autoPlayTimer?.cancel();
    _autoPlayTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || _banners.isEmpty) return;
      final nextPage = (_page + 1) % _banners.length;
      _pageCtrl.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  Future<void> _loadBanners() async {
    try {
      final data = await _bannerService.list(active: true);
      if (!mounted) return;
      setState(() {
        _banners = data;
        _loadingBanner = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errBanner = e.toString();
        _loadingBanner = false;
      });
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _autoPlayTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadBanners,
      child: CustomScrollView(
        slivers: [
          // Welcome message
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    Theme.of(context).colorScheme.secondary.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Chào mừng đến với ELORA',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Khám phá những xu hướng thời trang mới nhất',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[700],
                        ),
                  ),
                ],
              ),
            ),
          ),

          // Banner slider - Responsive height cho mobile (50% màn hình)
          SliverToBoxAdapter(
            child: Container(
              height: MediaQuery.of(context).size.height * 0.5,
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: _loadingBanner
                    ? const Center(child: CircularProgressIndicator())
                    : (_errBanner != null)
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.error_outline,
                                    size: 48, color: Colors.red[300]),
                                const SizedBox(height: 8),
                                Text(
                                  'Lỗi tải banner',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          )
                        : (_banners.isEmpty)
                            ? Container(
                                color: Colors.grey[200],
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.image_outlined,
                                          size: 48, color: Colors.grey[400]),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Chưa có banner',
                                        style:
                                            TextStyle(color: Colors.grey[600]),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            : Stack(
                                children: [
                                  PageView.builder(
                                    controller: _pageCtrl,
                                    onPageChanged: (i) =>
                                        setState(() => _page = i),
                                    itemCount: _banners.length,
                                    itemBuilder: (_, i) =>
                                        _BannerSlide(banner: _banners[i]),
                                  ),
                                  // Dots indicator
                                  Positioned(
                                    bottom: 16,
                                    left: 0,
                                    right: 0,
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: List.generate(
                                        _banners.length,
                                        (i) => Container(
                                          margin: const EdgeInsets.symmetric(
                                              horizontal: 4),
                                          width: _page == i ? 24 : 8,
                                          height: 8,
                                          decoration: BoxDecoration(
                                            color: _page == i
                                                ? Colors.white
                                                : Colors.white.withOpacity(0.5),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
              ),
            ),
          ),

          // Quick actions / categories
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Danh mục nổi bật',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 4,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: [
                      _CategoryCard(
                        icon: Icons.woman_outlined,
                        label: 'Nữ',
                        color: Colors.pink.shade100,
                        onTap: () {
                          // Navigate to products tab
                          DefaultTabController.of(context).animateTo(1);
                        },
                      ),
                      _CategoryCard(
                        icon: Icons.man_outlined,
                        label: 'Nam',
                        color: Colors.blue.shade100,
                        onTap: () {
                          DefaultTabController.of(context).animateTo(1);
                        },
                      ),
                      _CategoryCard(
                        icon: Icons.child_care_outlined,
                        label: 'Trẻ em',
                        color: Colors.orange.shade100,
                        onTap: () {
                          DefaultTabController.of(context).animateTo(1);
                        },
                      ),
                      _CategoryCard(
                        icon: Icons.local_offer_outlined,
                        label: 'Sale',
                        color: Colors.red.shade100,
                        onTap: () {
                          DefaultTabController.of(context).animateTo(1);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // CTA button
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to products tab
                  DefaultTabController.of(context).animateTo(1);
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Xem tất cả sản phẩm',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _CategoryCard({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Colors.black87),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerSlide extends StatelessWidget {
  final BannerModel banner;
  const _BannerSlide({required this.banner});

  @override
  Widget build(BuildContext context) {
    final desc = banner.description;
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned.fill(
          child: banner.imageUrl.isEmpty
              ? Container(color: Colors.grey[300])
              : Image.network(
                  banner.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.image_not_supported),
                  ),
                ),
        ),
        if (desc != null && desc.trim().isNotEmpty)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black54, Colors.transparent],
              ),
            ),
          ),
        if (desc != null && desc.trim().isNotEmpty)
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Text(
              desc,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                height: 1.2,
              ),
            ),
          ),
      ],
    );
  }
}
