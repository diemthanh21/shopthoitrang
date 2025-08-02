const repo = require('../repositories/khuyenmai.repository');

class KhuyenMaiService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoMaSanPham(maSP) {
    return await repo.getBySanPham(maSP);
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

module.exports = new KhuyenMaiService();
