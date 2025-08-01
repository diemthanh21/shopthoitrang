// services/taikhoannhanvien.service.js
const TaiKhoanNhanVienRepository = require('../repositories/taikhoannhanvien.repository');
const TaiKhoanNhanVien = require('../models/taikhoannhanvien.model');

class TaiKhoanNhanVienService {
  async dangNhap(tenDangNhap, matKhau) {
    const data = await TaiKhoanNhanVienRepository.findByCredentials(tenDangNhap, matKhau);
    if (!data) return null;
    return new TaiKhoanNhanVien(data);
  }
}

module.exports = new TaiKhoanNhanVienService();
