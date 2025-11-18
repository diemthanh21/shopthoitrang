import 'package:flutter/material.dart';
import '../models/membership_model.dart';
import '../services/address_service.dart';
import 'address_form_screen.dart';

class AddressSelectionScreen extends StatefulWidget {
  final int customerId;
  final DiaChiKhachHang? selectedAddress;

  const AddressSelectionScreen({
    super.key,
    required this.customerId,
    this.selectedAddress,
  });

  @override
  State<AddressSelectionScreen> createState() => _AddressSelectionScreenState();
}

class _AddressSelectionScreenState extends State<AddressSelectionScreen> {
  final _addressService = AddressService();
  List<DiaChiKhachHang> _addresses = [];
  bool _isLoading = true;
  DiaChiKhachHang? _selectedAddress;

  @override
  void initState() {
    super.initState();
    _selectedAddress = widget.selectedAddress;
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final addresses = await _addressService.getAddresses(widget.customerId);
      if (mounted) {
        setState(() {
          _addresses = addresses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _getFormattedAddress(DiaChiKhachHang address) {
    final parts = <String>[];

    if (address.diaChiCuThe?.isNotEmpty == true) {
      parts.add(address.diaChiCuThe!);
    }
    if (address.phuong?.isNotEmpty == true) {
      parts.add(address.phuong!);
    }
    if (address.tinh?.isNotEmpty == true) {
      parts.add(address.tinh!);
    }

    if (parts.isNotEmpty) {
      return parts.join(', ');
    }

    return address.diaChi ?? 'Chưa có địa chỉ';
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
        title: const Text(
          'Chọn địa chỉ giao hàng',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: _addresses.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.location_off,
                                size: 80,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có địa chỉ nào',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton.icon(
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const AddressFormScreen(),
                                    ),
                                  );
                                  _loadAddresses();
                                },
                                icon: const Icon(Icons.add),
                                label: const Text('Thêm địa chỉ mới'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _addresses.length,
                          itemBuilder: (context, index) {
                            final address = _addresses[index];
                            final isSelected =
                                _selectedAddress?.maDiaChi == address.maDiaChi;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? Colors.orange
                                      : Colors.grey[300]!,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: InkWell(
                                onTap: () {
                                  setState(() => _selectedAddress = address);
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Radio<int>(
                                            value: address.maDiaChi ?? 0,
                                            groupValue:
                                                _selectedAddress?.maDiaChi ?? 0,
                                            onChanged: (value) {
                                              setState(() =>
                                                  _selectedAddress = address);
                                            },
                                            activeColor: Colors.orange,
                                          ),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                // Họ tên
                                                if (address.ten?.isNotEmpty ==
                                                    true)
                                                  RichText(
                                                    text: TextSpan(
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                        color: Colors.black87,
                                                      ),
                                                      children: [
                                                        const TextSpan(
                                                          text: 'Họ tên: ',
                                                          style: TextStyle(
                                                            fontWeight:
                                                                FontWeight.w500,
                                                          ),
                                                        ),
                                                        TextSpan(
                                                          text: address.ten!,
                                                          style:
                                                              const TextStyle(
                                                            fontWeight:
                                                                FontWeight.w600,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),

                                                // Số điện thoại
                                                if (address.soDienThoai
                                                        ?.isNotEmpty ==
                                                    true) ...[
                                                  const SizedBox(height: 6),
                                                  RichText(
                                                    text: TextSpan(
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                        color: Colors.black87,
                                                      ),
                                                      children: [
                                                        const TextSpan(
                                                          text:
                                                              'Số điện thoại: ',
                                                          style: TextStyle(
                                                            fontWeight:
                                                                FontWeight.w500,
                                                          ),
                                                        ),
                                                        TextSpan(
                                                          text: address
                                                              .soDienThoai!,
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],

                                                // Địa chỉ
                                                const SizedBox(height: 6),
                                                RichText(
                                                  text: TextSpan(
                                                    style: const TextStyle(
                                                      fontSize: 14,
                                                      color: Colors.black87,
                                                    ),
                                                    children: [
                                                      const TextSpan(
                                                        text: 'Địa chỉ: ',
                                                        style: TextStyle(
                                                          fontWeight:
                                                              FontWeight.w500,
                                                        ),
                                                      ),
                                                      TextSpan(
                                                        text:
                                                            _getFormattedAddress(
                                                                address),
                                                        style: TextStyle(
                                                          color:
                                                              Colors.grey[700],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),

                                          // Badge mặc định
                                          if (address.macDinh == true)
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                horizontal: 8,
                                                vertical: 4,
                                              ),
                                              decoration: BoxDecoration(
                                                color: Colors.orange[100],
                                                borderRadius:
                                                    BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                'Mặc định',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.orange,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // Bottom buttons
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Nút thêm địa chỉ mới
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const AddressFormScreen(),
                              ),
                            );
                            _loadAddresses();
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('Thêm mới'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.orange,
                            side: const BorderSide(color: Colors.orange),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Nút xác nhận
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: _selectedAddress == null
                              ? null
                              : () {
                                  Navigator.pop(context, _selectedAddress);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            disabledBackgroundColor: Colors.grey[300],
                          ),
                          child: const Text(
                            'Xác nhận',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
