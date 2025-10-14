import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Đăng ký')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Họ tên')),
            const SizedBox(height: 12),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 12),
            TextField(controller: _passCtrl, decoration: const InputDecoration(labelText: 'Mật khẩu'), obscureText: true),
            const SizedBox(height: 16),
            if (auth.isLoading) const CircularProgressIndicator() else ElevatedButton(
              onPressed: () async {
                await auth.register(_emailCtrl.text.trim(), _passCtrl.text, _nameCtrl.text.trim());
                if (auth.isAuthenticated && mounted) Navigator.pop(context);
                if (auth.error != null && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error!)));
                }
              },
              child: const Text('Tạo tài khoản'),
            ),
          ],
        ),
      ),
    );
  }
}
