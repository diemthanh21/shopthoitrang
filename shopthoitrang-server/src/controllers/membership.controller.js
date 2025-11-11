const membershipWorkflow = require('../services/membership.workflow');

const MembershipController = {
  async getMembershipCard(req, res) {
    try {
      const { makhachhang } = req.params;
      const data = await membershipWorkflow.getCardSummary(Number(makhachhang));
      if (!data) {
        return res.status(404).json({ message: 'Khách hàng chưa có thẻ thành viên' });
      }
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Không thể lấy thẻ thành viên' });
    }
  },

  async getLoyalty(req, res) {
    try {
      const { makhachhang } = req.params;
      const data = await membershipWorkflow.getLoyaltySummary(Number(makhachhang));
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Không thể lấy tích luỹ' });
    }
  }
};

module.exports = MembershipController;
