import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  bool _obscure = true;
  String? _gender; // "Nam" | "Nữ" | "Khác"
  DateTime? _birthDate; // YYYY-MM-DD

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  String _fmtDate(DateTime d) {
    // yyyy-MM-dd (khớp kiểu server thường nhận cho NGAYSINH)
    final mm = d.month.toString().padLeft(2, '0');
    final dd = d.day.toString().padLeft(2, '0');
    return '${d.year}-$mm-$dd';
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final init = _birthDate ?? DateTime(now.year - 18, now.month, now.day);
    final first = DateTime(now.year - 100, 1, 1);
    final last = DateTime(now.year, now.month, now.day);

    final picked = await showDatePicker(
      context: context,
      initialDate: init,
      firstDate: first,
      lastDate: last,
      helpText: 'Chọn ngày sinh',
      cancelText: 'Hủy',
      confirmText: 'Chọn',
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  Future<void> _handleRegister(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    if (!(_formKey.currentState?.validate() ?? false)) return;

    await auth.register(
      _emailCtrl.text.trim(),
      _passCtrl.text,
      _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      gioiTinh: _gender, // ✅ thêm
      ngaySinh: _birthDate, // ✅ thêm
      // nếu bạn có username thì truyền thêm username: ...
    );

    if (!mounted) return;

    if (auth.error != null && auth.error!.isNotEmpty) {
      // Đăng ký thất bại
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error!)),
      );
    } else if (auth.isAuthenticated) {
      // Đăng ký thành công -> đăng xuất và chuyển đến trang đăng nhập
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Đăng ký thành công! Vui lòng đăng nhập.')),
      );

      // Clear token and user to require login
      await auth.logout();

      if (!mounted) return;

      // Navigate to login screen and remove all previous routes
      Navigator.pushNamedAndRemoveUntil(
        context,
        '/login',
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final primaryColor = Colors.blueAccent.shade700;

    InputBorder _br([Color? c]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
              color: c ?? Colors.transparent, width: c == null ? 0 : 2),
        );

    return Scaffold(
      backgroundColor: Colors.blue[50],
      appBar: AppBar(
        backgroundColor: primaryColor,
        title: const Text('Đăng ký', style: TextStyle(color: Colors.white)),
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Card(
            elevation: 8,
            shadowColor: primaryColor.withOpacity(0.3),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Icon(Icons.person_add_alt_1, size: 70, color: primaryColor),
                    const SizedBox(height: 16),
                    Text('Tạo tài khoản mới',
                        style: TextStyle(
                            color: primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 22)),
                    const SizedBox(height: 30),

                    // Họ tên
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: InputDecoration(
                        labelText: 'Họ tên',
                        prefixIcon:
                            Icon(Icons.badge_outlined, color: primaryColor),
                        filled: true,
                        fillColor: Colors.white,
                        border: _br(),
                        focusedBorder: _br(primaryColor),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty)
                          return 'Vui lòng nhập họ tên';
                        if (v.trim().length < 2) return 'Họ tên quá ngắn';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Email
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        prefixIcon:
                            Icon(Icons.alternate_email, color: primaryColor),
                        filled: true,
                        fillColor: Colors.white,
                        border: _br(),
                        focusedBorder: _br(primaryColor),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty)
                          return 'Vui lòng nhập email';
                        final s = v.trim();
                        final ok =
                            RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(s);
                        if (!ok) return 'Email không hợp lệ';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Mật khẩu
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu',
                        prefixIcon:
                            Icon(Icons.lock_outline, color: primaryColor),
                        suffixIcon: IconButton(
                          icon: Icon(
                              _obscure
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                              color: primaryColor),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        border: _br(),
                        focusedBorder: _br(primaryColor),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'Vui lòng nhập mật khẩu';
                        if (v.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Số điện thoại (tuỳ chọn)
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Số điện thoại (tuỳ chọn)',
                        prefixIcon:
                            Icon(Icons.phone_outlined, color: primaryColor),
                        filled: true,
                        fillColor: Colors.white,
                        border: _br(),
                        focusedBorder: _br(primaryColor),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Giới tính
                    DropdownButtonFormField<String>(
                      value: _gender,
                      items: const [
                        DropdownMenuItem(value: 'Nam', child: Text('Nam')),
                        DropdownMenuItem(value: 'Nữ', child: Text('Nữ')),
                        DropdownMenuItem(value: 'Khác', child: Text('Khác')),
                      ],
                      decoration: InputDecoration(
                        labelText: 'Giới tính',
                        prefixIcon:
                            Icon(Icons.transgender, color: primaryColor),
                        filled: true,
                        fillColor: Colors.white,
                        border: _br(),
                        focusedBorder: _br(primaryColor),
                      ),
                      onChanged: (v) => setState(() => _gender = v),
                    ),
                    const SizedBox(height: 16),

                    // Ngày sinh
                    InkWell(
                      onTap: _pickBirthDate,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Ngày sinh',
                          prefixIcon:
                              Icon(Icons.cake_outlined, color: primaryColor),
                          filled: true,
                          fillColor: Colors.white,
                          border: _br(),
                          focusedBorder: _br(primaryColor),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 4),
                          child: Text(
                            _birthDate == null
                                ? 'Chọn ngày sinh'
                                : _fmtDate(_birthDate!),
                            style: TextStyle(
                              color: _birthDate == null
                                  ? Colors.grey[600]
                                  : Colors.black87,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: auth.isLoading
                            ? null
                            : () => _handleRegister(context),
                        child: auth.isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Tạo tài khoản',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                )),
                      ),
                    ),

                    if (auth.error != null && auth.error!.isNotEmpty) ...[
                      const SizedBox(height: 12),
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
