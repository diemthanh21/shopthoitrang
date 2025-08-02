const TaiKhoanNhanVienRepository = require('../repositories/taikhoannhanvien.repository');
const TaiKhoanNhanVien = require('../models/taikhoannhanvien.model');

class TaiKhoanNhanVienService {
  // 🔐 Đăng nhập
  async dangNhap(tenDangNhap, matKhau) {
    const data = await TaiKhoanNhanVienRepository.findByCredentials(tenDangNhap, matKhau);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }

  // ✅ Tạo tài khoản mới
  async taoMoi(taiKhoanData) {
    const data = await TaiKhoanNhanVienRepository.create(taiKhoanData);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }

  // 📥 Lấy toàn bộ tài khoản
  async layTatCa() {
    const list = await TaiKhoanNhanVienRepository.getAll();
    return list;
  }

  // 🔍 Lấy theo mã nhân viên
  async layTheoMa(maNhanVien) {
    const data = await TaiKhoanNhanVienRepository.getById(maNhanVien);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }

  // ✏️ Cập nhật thông tin tài khoản
  async capNhat(maNhanVien, thongTinCapNhat) {
    const data = await TaiKhoanNhanVienRepository.update(maNhanVien, thongTinCapNhat);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }

  // 🗑️ Xoá mềm tài khoản
  async xoa(maNhanVien) {
    const data = await TaiKhoanNhanVienRepository.delete(maNhanVien);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }
}

module.exports = new TaiKhoanNhanVienService();
