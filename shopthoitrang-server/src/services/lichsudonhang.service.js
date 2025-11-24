const repo = require('../repositories/lichsudonhang.repository');

class LichSuDonHangService {
  /**
   * Ghi log thay đổi trạng thái đơn hàng
   */
  async logStatusChange({
    madonhang,
    manhanvien,
    trangthaicu,
    trangthaimoi,
    ghichu = null,
  }) {
    try {
      const payload = {
        madonhang,
        manhanvien: manhanvien || null,
        trangthaicu: trangthaicu || null,
        trangthaimoi: trangthaimoi || null,
        ghichu,
        thoigian: new Date().toISOString(),
      };
      
      console.log('[LichSuDonHang] Creating log entry:', payload);
      const log = await repo.create(payload);
      console.log('[LichSuDonHang] Log created:', log.id);
      
      return log;
    } catch (error) {
      console.error('[LichSuDonHang] Error creating log:', error);
      // Don't throw - log errors shouldn't break order updates
      return null;
    }
  }

  /**
   * Lấy lịch sử của 1 đơn hàng
   */
  async getOrderHistory(madonhang) {
    return repo.getByOrder(madonhang);
  }

  /**
   * Lấy tất cả lịch sử (có thể filter)
   */
  async getAll(filters = {}) {
    return repo.getAll(filters);
  }
}

module.exports = new LichSuDonHangService();
