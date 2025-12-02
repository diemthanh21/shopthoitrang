/**
 * Model: Lịch sử đơn hàng
 * Lưu lại mọi thay đổi trạng thái và nhân viên thực hiện
 */
class LichSuDonHang {
  constructor({
    id,
    madonhang,
    manhanvien,
    trangthaicu,
    trangthaimoi,
    ghichu,
    thoigian,
    ...rest
  }) {
    this.id = id;
    this.madonhang = madonhang;
    this.manhanvien = manhanvien || null; // nhân viên thực hiện thay đổi
    this.trangthaicu = trangthaicu || null;
    this.trangthaimoi = trangthaimoi || null;
    this.ghichu = ghichu || null; // lý do hủy, ghi chú, v.v.
    this.thoigian = thoigian || new Date().toISOString();
    
    Object.assign(this, rest);
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = LichSuDonHang;
