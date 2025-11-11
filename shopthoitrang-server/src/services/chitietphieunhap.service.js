const repo = require('../repositories/chitietphieunhap.repository');

class ChiTietPhieuNhapService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async taoMoi(data) {
    const { maphieunhap, machitietsanpham, soluong, ghichu } = data || {};

    // Bắt buộc: maphieunhap, machitietsanpham, soluong
    if (!maphieunhap || !machitietsanpham || !soluong) {
      throw new Error(
        'Thiếu thông tin bắt buộc: maphieunhap, machitietsanpham, soluong'
      );
    }

    if (soluong <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    // Chỉ gửi những field hợp lệ xuống DB
    const entity = {
      maphieunhap,
      machitietsanpham,
      soluong,
      ghichu: ghichu ?? null
    };

    return await repo.create(entity);
  }

  async capNhat(ma, data) {
    const fields = {};

    if (data.soluong !== undefined) {
      if (data.soluong <= 0) {
        throw new Error('Số lượng phải lớn hơn 0');
      }
      fields.soluong = data.soluong;
    }

    if (data.ghichu !== undefined) {
      fields.ghichu = data.ghichu;
    }

    // Nếu không có gì để update thì có thể trả luôn bản ghi cũ hoặc báo lỗi tuỳ ý
    if (Object.keys(fields).length === 0) {
      // Ở đây mình cứ cho update rỗng -> repo.update sẽ trả bản ghi hiện tại
      return await repo.getById(ma);
    }

    return await repo.update(ma, fields);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new ChiTietPhieuNhapService();
