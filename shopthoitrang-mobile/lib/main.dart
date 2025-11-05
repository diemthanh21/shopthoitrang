import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shopthoitrang_mobile/screens/dashboard_screen.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ShopThoitrangApp());
}

class ShopThoitrangApp extends StatefulWidget {
  const ShopThoitrangApp({super.key});

  @override
  State<ShopThoitrangApp> createState() => _ShopThoitrangAppState();
}

class _ShopThoitrangAppState extends State<ShopThoitrangApp> {
  late final AuthProvider _authProvider;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    // Load session khi app khởi động
    _authProvider.loadSession();
  }

  @override
  void dispose() {
    _authProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            // Key để force rebuild khi auth state thay đổi
            key: ValueKey(
                auth.isAuthenticated ? auth.user?.maKhachHang : 'logged_out'),
            title: 'Shop Thời Trang',
            theme:
                ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
            home: auth.isAuthenticated
                ? const DashboardScreen()
                : const LoginScreen(),
            debugShowCheckedModeBanner: false,
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/dashboard': (context) => const DashboardScreen(),
            },
          );
        },
      ),
    );
  }
}
