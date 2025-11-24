const membershipService = require('../services/membership.service');

const MembershipController = {
  async getMembershipCard(req, res) {
    try {
      const { makhachhang } = req.params;
      const data = await membershipService.getCardSummary(Number(makhachhang));
      if (!data) {
        return res.status(404).json({ message: 'Khach hang chua co the thanh vien' });
      }
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the lay the thanh vien' });
    }
  },

  async getLoyalty(req, res) {
    try {
      const { makhachhang } = req.params;
      const data = await membershipService.getLoyaltySummary(Number(makhachhang));
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the lay tich luy' });
    }
  },

  /**
   * Lấy thông tin điểm tích lũy (điểm hiện tại, pending, năm)
   * GET /api/membership/:makhachhang/points
   */
  async getPointsSummary(req, res) {
    try {
      const { makhachhang } = req.params;
      const data = await membershipService.getPointsSummary(Number(makhachhang));
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the lay thong tin diem' });
    }
  },

  /**
   * Lấy lịch sử giao dịch điểm
   * GET /api/membership/:makhachhang/point-history?limit=50
   */
  async getPointHistory(req, res) {
    try {
      const { makhachhang } = req.params;
      const { limit } = req.query;
      const data = await membershipService.getPointHistory(Number(makhachhang), {
        limit: limit ? Number(limit) : 50
      });
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the lay lich su diem' });
    }
  },

  /**
   * Duyệt điểm pending (job tự động hoặc admin trigger)
   * POST /api/membership/approve-pending-points
   */
  async releasePendingPoints(req, res) {
    try {
      const result = await membershipService.releasePendingPoints();
      res.json({
        message: 'Da chuyen diem cho sang diem su dung',
        ...result,
      });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the xu ly diem cho' });
    }
  },

  /**
   * Điều chỉnh điểm pending khi trả/đổi hàng
   * POST /api/membership/adjust-pending
   * Body: { madonhang, adjustment_amount, reason }
   */
  async adjustPendingPoints(req, res) {
    try {
      const { madonhang, adjustment_amount, reason } = req.body;
      if (!madonhang || adjustment_amount === undefined) {
        return res.status(400).json({ message: 'Thieu thong tin don hang hoac gia tri dieu chinh' });
      }
      const result = await membershipService.adjustPendingPointsForReturn(
        Number(madonhang),
        Number(adjustment_amount),
        reason || 'Tra/doi hang'
      );
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Khong the dieu chinh diem' });
    }
  },
};

module.exports = MembershipController;
