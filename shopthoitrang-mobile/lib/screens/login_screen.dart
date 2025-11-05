import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    if (!(_formKey.currentState?.validate() ?? false)) return;

    await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;

    if (auth.isAuthenticated) {
      // Dùng pushNamedAndRemoveUntil để xóa toàn bộ stack và chuyển về dashboard
      // Điều này đảm bảo không có màn hình nào giữ state cũ
      Navigator.pushNamedAndRemoveUntil(
        context,
        '/dashboard',
        (route) => false,
      );
    } else {
      final msg = auth.error ?? 'Đăng nhập thất bại. Vui lòng thử lại.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  // DEBUG: Method để clear tất cả data
  Future<void> _clearAllData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (kDebugMode) print('[DEBUG] Cleared all SharedPreferences data');

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Đã xóa tất cả dữ liệu! Khởi động lại app.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final primaryColor = Colors.blueAccent.shade700;

    return Scaffold(
      backgroundColor: Colors.blue[50],
      appBar: AppBar(
        backgroundColor: primaryColor,
        title: const Text('Đăng nhập', style: TextStyle(color: Colors.white)),
        centerTitle: true,
        elevation: 0,
        actions: [
          // DEBUG: Button để clear all data
          if (kDebugMode)
            IconButton(
              icon: const Icon(Icons.delete_forever, color: Colors.red),
              tooltip: 'Clear All Data (Debug)',
              onPressed: _clearAllData,
            ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Card(
            elevation: 8,
            shadowColor: primaryColor.withOpacity(0.3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Icon(Icons.lock_outline, size: 70, color: primaryColor),
                    const SizedBox(height: 16),
                    Text(
                      'Chào mừng trở lại!',
                      style: TextStyle(
                        color: primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                      ),
                    ),
                    const SizedBox(height: 30),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        hintText: 'example@gmail.com',
                        prefixIcon:
                            Icon(Icons.email_outlined, color: primaryColor),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: primaryColor, width: 2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return 'Vui lòng nhập email';
                        }
                        // Validate email format
                        final emailRegex =
                            RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                        if (!emailRegex.hasMatch(v.trim())) {
                          return 'Email không hợp lệ';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu',
                        prefixIcon:
                            Icon(Icons.lock_outline, color: primaryColor),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure ? Icons.visibility : Icons.visibility_off,
                            color: primaryColor,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: primaryColor, width: 2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'Vui lòng nhập mật khẩu';
                        if (v.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed:
                            auth.isLoading ? null : () => _handleLogin(context),
                        child: auth.isLoading
                            ? const CircularProgressIndicator(
                                color: Color.fromARGB(255, 254, 254, 254))
                            : const Text(
                                'Đăng nhập',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: auth.isLoading
                          ? null
                          : () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const RegisterScreen()),
                              ),
                      child: Text(
                        'Chưa có tài khoản? Đăng ký ngay',
                        style: TextStyle(color: primaryColor, fontSize: 16),
                      ),
                    ),
                    if (auth.error != null && auth.error!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(auth.error!,
                          style: const TextStyle(color: Colors.red)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
