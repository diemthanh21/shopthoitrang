const TaiKhoanKhachHangRepository = require('../repositories/taikhoankhachhang.repository');
const TaiKhoanKhachHang = require('../models/taikhoankhachhang.model');

class TaiKhoanKhachHangService {
  async dangNhap(tenDangNhap, pass) {
    const data = await TaiKhoanKhachHangRepository.findByCredentials(tenDangNhap, pass);
    if (!data) return null;
    return data;
  }

  async taoMoi(taiKhoanData) {
    const data = await TaiKhoanKhachHangRepository.create(taiKhoanData);
    return data;
  }

  async layTatCa() {
    return await TaiKhoanKhachHangRepository.getAll();
  }

  async layTheoMa(maKhachHang) {
    return await TaiKhoanKhachHangRepository.getById(maKhachHang);
  }

  async capNhat(maKhachHang, thongTinCapNhat) {
    return await TaiKhoanKhachHangRepository.update(maKhachHang, thongTinCapNhat);
  }

  async xoa(maKhachHang) {
    return await TaiKhoanKhachHangRepository.delete(maKhachHang);
  }
}

module.exports = new TaiKhoanKhachHangService();
