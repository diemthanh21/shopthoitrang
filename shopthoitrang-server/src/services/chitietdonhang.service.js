const repo = require('../repositories/chitietdonhang.repository');

class ChiTietDonHangService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async taoMoi(data) {
    if (!data.madonhang || !data.machitietsanpham || !data.soluong || !data.dongia) {
      throw new Error('Thiếu thông tin bắt buộc: madonhang, machitietsanpham, soluong, dongia');
    }

    if (data.soluong <= 0) throw new Error('Số lượng phải lớn hơn 0');

    return await repo.create(data);
  }

  async layTheoDonHang(madonhang) {
    if (!madonhang) throw new Error('Thiếu madonhang');
    return await repo.getByOrderId(madonhang);
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

module.exports = new ChiTietDonHangService();
