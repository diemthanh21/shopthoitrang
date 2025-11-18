const repo = require('../repositories/chitietphieudathang.repository');

class ChiTietPhieuDatHangService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async taoMoi(data) {
    if (!data.maphieudathang || !data.machitietsanpham || !data.soluong || !data.dongia || !data.thanhtien) {
      throw new Error('Thieu thong tin bat buoc: maphieudathang, machitietsanpham, soluong, dongia, thanhtien');
    }

    if (data.soluong <= 0) throw new Error('So luong phai lon hon 0');

    return await repo.create(data);
  }

  async capNhat(ma, data) {
    if (data.soluong && data.soluong <= 0) {
      throw new Error('So luong phai lon hon 0');
    }
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new ChiTietPhieuDatHangService();
