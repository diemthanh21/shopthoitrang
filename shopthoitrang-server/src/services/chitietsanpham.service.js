const repo = require('../repositories/chitietsanpham.repository');

class ChiTietSanPhamService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoMaSanPham(maSP) {
    return await repo.getByMaSanPham(maSP);
  }

  async taoMoi(data) {
    return await repo.create(data);
  }

  async capNhat(ma, data) {
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }

  async timKiemTheoTuKhoa(keyword) {
    return await repo.searchByKeyword(keyword);
  }
}

module.exports = new ChiTietSanPhamService();