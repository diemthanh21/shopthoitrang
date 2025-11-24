const service = require('../services/phivanchuyen.service');

const PhiVanChuyenController = {
  async getConfig(req, res) {
    try {
      const config = await service.getConfig();
      res.json(config.toJSON());
    } catch (err) {
      console.error('[PhiVanChuyenController.getConfig] Error:', err);
      res.status(500).json({ message: err?.message || 'Loi lay cau hinh phi van chuyen' });
    }
  },

  async updateConfig(req, res) {
    try {
      const updated = await service.updateConfig(req.body || {});
      res.json(updated.toJSON());
    } catch (err) {
      console.error('[PhiVanChuyenController.updateConfig] Error:', err);
      res
        .status(err?.status || 400)
        .json({ message: err?.message || 'Loi cap nhat phi van chuyen' });
    }
  },

  async estimate(req, res) {
    try {
      const province =
        req.query.tinh ||
        req.query.province ||
        req.query.tinh_giaohang ||
        req.query.tinhGiaohang ||
        null;
      const config = await service.getConfig();
      const fee = await service.calculateFeeForProvince(province);

      res.json({
        tinh_giaohang: province,
        phivanchuyen: fee,
        dang_ap_dung: config?.dang_ap_dung ?? true,
        tinh_kho: config?.tinh_kho || null,
      });
    } catch (err) {
      console.error('[PhiVanChuyenController.estimate] Error:', err);
      res.status(500).json({ message: err?.message || 'Loi uoc tinh phi van chuyen' });
    }
  },
};

module.exports = PhiVanChuyenController;
