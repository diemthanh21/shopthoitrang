const repo = require('../repositories/chitietphieunhap.repository');

class ChiTietPhieuNhapService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async taoMoi(data) {
    if (!data.maphieunhap || !data.machitietsanpham || !data.soluong || !data.dongianhap) {
      throw new Error('Thiếu thông tin bắt buộc: maphieunhap, machitietsanpham, soluong, dongianhap');
    }

    if (data.soluong <= 0) throw new Error('Số lượng phải lớn hơn 0');

    return await repo.create(data);
  }

  async capNhat(ma, data) {
    if (data.soluong && data.soluong <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new ChiTietPhieuNhapService();
