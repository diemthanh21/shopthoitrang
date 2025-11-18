/// Mapping & helpers for Return (TraHang) and Exchange (DoiHang) statuses
import 'package:flutter/material.dart';

class ReturnStatusMapper {
  static const labels = {
    'CHO_DUYET': 'Chờ duyệt',
    'DA_DUYET_CHO_GUI_HANG': 'Chờ gửi hàng',
    'DA_NHAN_HANG_CHO_KIEM_TRA': 'Đã nhận - chờ kiểm tra',
    'KHONG_HOP_LE': 'Không hợp lệ',
    'DU_DIEU_KIEN_HOAN_TIEN': 'Đủ điều kiện hoàn',
    'DA_HOAN_TIEN': 'Đã hoàn tiền',
    'TU_CHOI': 'Từ chối',
  };

  static Color color(String code) {
    switch (code) {
      case 'CHO_DUYET':
        return Colors.blueGrey;
      case 'DA_DUYET_CHO_GUI_HANG':
        return Colors.blue;
      case 'DA_NHAN_HANG_CHO_KIEM_TRA':
        return Colors.deepPurple;
      case 'DU_DIEU_KIEN_HOAN_TIEN':
        return Colors.teal;
      case 'DA_HOAN_TIEN':
        return Colors.green;
      case 'KHONG_HOP_LE':
      case 'TU_CHOI':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

class ExchangeStatusMapper {
  static const labels = {
    'CHO_DUYET': 'Chờ duyệt',
    'DA_DUYET_CHO_GUI_HANG_CU': 'Chờ gửi hàng cũ',
    'DA_NHAN_HANG_CU_CHO_KIEM_TRA': 'Đã nhận hàng cũ',
    'KHONG_HOP_LE': 'Không hợp lệ',
    'DU_DIEU_KIEN_XU_LY_CHENH_LECH': 'Đủ điều kiện tính chênh',
    'DA_XU_LY_CHENH_LECH_CHO_TAO_DON': 'Chuẩn bị tạo đơn',
    'DA_TAO_DON_MOI_DANG_GIAO': 'Đơn mới đang giao',
    'DA_DOI_XONG': 'Đã đổi xong',
    'TU_CHOI': 'Từ chối',
  };

  static Color color(String code) {
    switch (code) {
      case 'CHO_DUYET':
        return Colors.blueGrey;
      case 'DA_DUYET_CHO_GUI_HANG_CU':
        return Colors.blue;
      case 'DA_NHAN_HANG_CU_CHO_KIEM_TRA':
        return Colors.deepPurple;
      case 'DU_DIEU_KIEN_XU_LY_CHENH_LECH':
        return Colors.teal;
      case 'DA_TAO_DON_MOI_DANG_GIAO':
      case 'DA_DOI_XONG':
        return Colors.green;
      case 'KHONG_HOP_LE':
      case 'TU_CHOI':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
