const repo = require('../repositories/hinhanhsanpham.repository');

class HinhAnhSanPhamService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoChiTietSP(maChiTiet) {
    return await repo.getByMaChiTietSanPham(maChiTiet);
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
}

module.exports = new HinhAnhSanPhamService();