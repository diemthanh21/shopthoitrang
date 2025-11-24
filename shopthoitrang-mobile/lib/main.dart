import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shopthoitrang_mobile/screens/dashboard_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/return_provider.dart';
import 'providers/exchange_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'config/supabase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('vi_VN');

  // Khởi tạo Supabase với anon key đã cấu hình (fallback hoặc --dart-define)
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );

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
        ChangeNotifierProvider(create: (_) => ReturnProvider()),
        ChangeNotifierProvider(create: (_) => ExchangeProvider()),
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
