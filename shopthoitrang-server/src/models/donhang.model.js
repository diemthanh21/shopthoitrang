class DonHang {
  constructor({
    madonhang,
    makhachhang,
    manhanvien,
    ngaydathang,
    thanhtien,
    phuongthucthanhtoan,
    trangthaithanhtoan,
    trangthaidonhang,
    madiachi,
    ngaygiaohang,
    momo_order_id,
    momo_request_id,
    momo_qr_code_url,
    momo_expires_at,
  }) {
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.manhanvien = manhanvien || null;
    this.ngaydathang = ngaydathang;
    this.ngaygiaohang = ngaygiaohang || null; // thời điểm xác nhận đã giao
    this.thanhtien = thanhtien;
    this.phuongthucthanhtoan = phuongthucthanhtoan;
    this.trangthaithanhtoan = trangthaithanhtoan;
    this.trangthaidonhang = trangthaidonhang;
    this.madiachi = madiachi; // optional link to diachikhachhang
    // Thông tin phiên thanh toán MOMO (tạm thời, có thể hết hạn sau 3 phút)
    this.momo_order_id = momo_order_id || null;
    this.momo_request_id = momo_request_id || null;
    this.momo_qr_code_url = momo_qr_code_url || null;
    this.momo_expires_at = momo_expires_at || null; // ISO timestamp
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DonHang;