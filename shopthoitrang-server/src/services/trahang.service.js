const repo = require('../repositories/trahang.repository');

class TraHangService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoDonHang(maDonHang) {
    return await repo.getByDonHang(maDonHang);
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

module.exports = new TraHangService();
