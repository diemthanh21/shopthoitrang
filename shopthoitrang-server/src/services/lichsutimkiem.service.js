const repo = require('../repositories/lichsutimkiem.repository');

class LichSuTimKiemService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoKhachHang(maKH) {
    return await repo.getByKhachHang(maKH);
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

module.exports = new LichSuTimKiemService();
