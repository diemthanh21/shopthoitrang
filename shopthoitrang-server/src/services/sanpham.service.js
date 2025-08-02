const SanPhamRepository = require('../repositories/sanpham.repository');

class SanPhamService {
  async layTatCa() {
    return await SanPhamRepository.getAll();
  }

  async layTheoMa(maSanPham) {
    return await SanPhamRepository.getById(maSanPham);
  }

  async taoMoi(sanPham) {
    return await SanPhamRepository.create(sanPham);
  }

  async capNhat(maSanPham, thongTinCapNhat) {
    return await SanPhamRepository.update(maSanPham, thongTinCapNhat);
  }

  async xoa(maSanPham) {
    return await SanPhamRepository.delete(maSanPham);
  }

  async timTheoDanhMuc(maDanhMuc) {
    return await SanPhamRepository.findByDanhMuc(maDanhMuc);
  }

  async timTheoThuongHieu(maThuongHieu) {
    return await SanPhamRepository.findByThuongHieu(maThuongHieu);
  }

  async timTheoTrangThai(trangThai) {
    return await SanPhamRepository.findByTrangThai(trangThai);
  }
}

module.exports = new SanPhamService();
