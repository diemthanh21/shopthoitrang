import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/shop_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ShopThoitrangApp());
}

class ShopThoitrangApp extends StatelessWidget {
  const ShopThoitrangApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'Shop Thời Trang',
            theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
            home: auth.isAuthenticated ? const ShopScreen() : const LoginScreen(),
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
