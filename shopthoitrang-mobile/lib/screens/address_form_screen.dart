import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../services/address_service.dart';
import '../models/membership_model.dart';

class AddressFormScreen extends StatefulWidget {
  final DiaChiKhachHang? address;

  const AddressFormScreen({super.key, this.address});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressService = AddressService();

  // Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _specificAddressController = TextEditingController();

  // Dropdown values
  String? _selectedProvinceId;
  String? _selectedWardName;

  List<Map<String, dynamic>> _provinces = [];
  List<Map<String, dynamic>> _wards = [];

  bool _isLoadingProvinces = true;
  bool _isLoadingWards = false;
  bool _isDefaultAddress = false;

  @override
  void initState() {
    super.initState();
    _loadProvinces();
    if (widget.address != null) {
      _loadExistingAddress();
    }
  }

  void _loadExistingAddress() {
    final addr = widget.address!;
    // Parse address string to extract info
    // Format expected: "Name | Phone | Province, District, Ward | Specific Address"
    final parts = (addr.diaChi ?? '').split('|');
    if (parts.length >= 4) {
      _nameController.text = parts[0].trim();
      _phoneController.text = parts[1].trim();
      _specificAddressController.text = parts[3].trim();
    } else {
      _specificAddressController.text = addr.diaChi ?? '';
    }
  }

  Future<void> _loadProvinces() async {
    try {
      print('🔍 Đang load 34 tỉnh/thành phố mới...');
      final response = await http.get(
        Uri.parse('https://vietnamlabs.com/api/vietnamprovince'),
      );

      print('📡 Status code: ${response.statusCode}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> result =
            json.decode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = result['data'] ?? [];
        print('✅ Đã load ${data.length} tỉnh/thành phố');

        setState(() {
          _provinces = data.cast<Map<String, dynamic>>();
          _isLoadingProvinces = false;
        });
      } else {
        print('❌ Lỗi: Status ${response.statusCode}');
        setState(() => _isLoadingProvinces = false);
      }
    } catch (e) {
      print('❌ Lỗi load tỉnh/thành: $e');
      setState(() => _isLoadingProvinces = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải danh sách tỉnh/thành: $e')),
        );
      }
    }
  }

  Future<void> _loadWards(String provinceId) async {
    setState(() {
      _isLoadingWards = true;
      _wards = [];
      _selectedWardName = null;
    });

    try {
      print('🔍 Đang load phường/xã cho tỉnh ID: $provinceId');

      // Tìm province đã chọn
      final selectedProvince = _provinces.firstWhere(
        (p) => p['id'] == provinceId,
        orElse: () => {},
      );

      if (selectedProvince.isEmpty) {
        setState(() => _isLoadingWards = false);
        return;
      }

      final List<dynamic> wardsData = selectedProvince['wards'] ?? [];
      print('✅ Đã load ${wardsData.length} phường/xã');

      setState(() {
        _wards = wardsData.cast<Map<String, dynamic>>();
        _isLoadingWards = false;
      });
    } catch (e) {
      print('❌ Lỗi load phường/xã: $e');
      setState(() => _isLoadingWards = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải danh sách phường/xã: $e')),
        );
      }
    }
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedProvinceId == null || _selectedWardName == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn đầy đủ Tỉnh/Thành phố và Phường/Xã'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final authProv = context.read<AuthProvider>();
    final user = authProv.user;
    if (user == null) return;

    // Get province name from ID
    final provinceName = _provinces
        .firstWhere((p) => p['id'] == _selectedProvinceId)['province'];

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const Center(child: CircularProgressIndicator()),
      );

      bool success;
      if (widget.address != null && widget.address!.maDiaChi != null) {
        // Update existing address
        success = await _addressService.updateAddress(
          widget.address!.maDiaChi!,
          ten: _nameController.text.trim(),
          soDienThoai: _phoneController.text.trim(),
          tinh: provinceName,
          phuong: _selectedWardName!,
          diaChiCuThe: _specificAddressController.text.trim(),
          macDinh: _isDefaultAddress,
        );
      } else {
        // Add new address
        success = await _addressService.addAddress(
          user.maKhachHang,
          ten: _nameController.text.trim(),
          soDienThoai: _phoneController.text.trim(),
          tinh: provinceName,
          phuong: _selectedWardName!,
          diaChiCuThe: _specificAddressController.text.trim(),
          macDinh: _isDefaultAddress,
        );
      }

      if (!mounted) return;
      Navigator.pop(context); // Close loading

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.address != null
                ? 'Cập nhật địa chỉ thành công'
                : 'Thêm địa chỉ thành công'),
          ),
        );
        Navigator.pop(context, true); // Return to previous screen
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lưu địa chỉ thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _specificAddressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.address != null ? 'Sửa Địa chỉ' : 'Địa chỉ mới',
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Vui lòng sử dụng địa chỉ với định dạng mới để đảm bảo giao hàng nhanh chóng và chính xác.',
                      style: TextStyle(fontSize: 12, color: Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Contact section
            const Text(
              'Liên hệ',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            // Name field
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Họ và tên',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Vui lòng nhập họ tên' : null,
            ),
            const SizedBox(height: 12),

            // Phone field
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: 'Số điện thoại',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              keyboardType: TextInputType.phone,
              validator: (v) {
                if (v == null || v.trim().isEmpty) {
                  return 'Vui lòng nhập số điện thoại';
                }
                if (!RegExp(r'^[0-9]{10,11}$').hasMatch(v.trim())) {
                  return 'Số điện thoại không hợp lệ';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Address section
            const Text(
              'Địa chỉ',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            // Province dropdown
            _isLoadingProvinces
                ? const LinearProgressIndicator()
                : DropdownButtonFormField<String>(
                    value: _selectedProvinceId,
                    decoration: InputDecoration(
                      labelText: 'Tỉnh/Thành phố (34 tỉnh mới)',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    items: _provinces.map((province) {
                      return DropdownMenuItem<String>(
                        value: province['id'].toString(),
                        child: Text(province['province'] ?? ''),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedProvinceId = value;
                        _selectedWardName = null;
                        _wards = [];
                      });
                      if (value != null) {
                        _loadWards(value);
                      }
                    },
                    validator: (v) =>
                        v == null ? 'Vui lòng chọn tỉnh/thành phố' : null,
                  ),
            const SizedBox(height: 12),

            // Ward dropdown
            _isLoadingWards
                ? const LinearProgressIndicator()
                : DropdownButtonFormField<String>(
                    value: _selectedWardName,
                    decoration: InputDecoration(
                      labelText: 'Phường/Xã (sau sát nhập)',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    items: _wards.map((ward) {
                      return DropdownMenuItem<String>(
                        value: ward['name'].toString(),
                        child: Text(ward['name'] ?? ''),
                      );
                    }).toList(),
                    onChanged: _selectedProvinceId == null
                        ? null
                        : (value) {
                            setState(() => _selectedWardName = value);
                          },
                    validator: (v) =>
                        v == null ? 'Vui lòng chọn phường/xã' : null,
                  ),
            const SizedBox(height: 12),

            // Specific address field
            TextFormField(
              controller: _specificAddressController,
              decoration: InputDecoration(
                labelText: 'Tên đường, Toà nhà, Số nhà.',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              maxLines: 2,
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'Vui lòng nhập địa chỉ cụ thể'
                  : null,
            ),
            const SizedBox(height: 20),

            // Default address checkbox
            CheckboxListTile(
              value: _isDefaultAddress,
              onChanged: (value) {
                setState(() => _isDefaultAddress = value ?? false);
              },
              title: const Text('Đặt làm địa chỉ mặc định'),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: _saveAddress,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'HOÀN THÀNH',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
