// Centralized status constants for return (TRAHANG) and exchange (DOIHANG) workflows
// Helps avoid typos and keep UI mapping consistent.

module.exports = {
  TRAHANG: {
    CHO_DUYET: 'Chờ duyệt',
    DA_DUYET_CHO_GUI_HANG: 'Đã duyệt - Chờ gửi hàng',
    DA_NHAN_HANG_CHO_KIEM_TRA: 'Đã nhận hàng - Chờ kiểm tra',
    KHONG_HOP_LE: 'Không hợp lệ',
    DU_DIEU_KIEN_HOAN_TIEN: 'Đủ điều kiện hoàn tiền',
    DA_HOAN_TIEN: 'Đã hoàn tiền',
    TU_CHOI: 'Từ chối'
  },
  DOIHANG: {
    CHO_DUYET: 'Chờ duyệt',
    DA_DUYET_CHO_GUI_HANG_CU: 'Đã duyệt - Chờ gửi hàng cũ',
    DA_NHAN_HANG_CU_CHO_KIEM_TRA: 'Đã nhận hàng cũ - Chờ kiểm tra',
    KHONG_HOP_LE: 'Không hợp lệ',
    CHO_TAO_DON_MOI: 'Chờ tạo đơn mới',
    DANG_GIAO_HANG_MOI: 'Đang giao hàng mới',
    DA_DOI_XONG: 'Đã đổi xong',
    TU_CHOI: 'Từ chối'
  },
  TIEN_DOI_HANG: {
    CHUA_XU_LY: 'CHƯA_XỬ_LÝ',
    CHO_KH_THANH_TOAN_THEM: 'CHỜ_KH_THANH_TOÁN_THÊM',
    YEU_CAU_KH_THANH_TOAN_THEM: 'YÊU_CẦU_KH_THANH_TOÁN_THÊM',
    DA_THANH_TOAN_THEM: 'ĐÃ_THANH_TOÁN_THÊM',
    CHO_HOAN_BOT: 'CHỜ_HOÀN_BỚT',
    DA_HOAN_BOT: 'ĐÃ_HOÀN_BỚT',
    DA_XU_LY: 'ĐÃ_XỬ_LÝ'
  }
};
