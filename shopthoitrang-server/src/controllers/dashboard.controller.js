const dashboardService = require('../services/dashboard.service');

module.exports = {
  async summary(req, res) {
    try {
      // Temporary debug logging (có thể gỡ sau khi hết lỗi)
      const sanitizedAuth = req.headers.authorization ? req.headers.authorization.slice(0,25) + '...' : 'none';
      console.log('[dashboard.controller] incoming', {
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        hasAuth: !!req.headers.authorization,
        authPreview: sanitizedAuth,
        supabaseUrlSet: !!process.env.SUPABASE_URL,
        supabaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });

      const data = await dashboardService.summary();
      res.json(data);
    } catch (e) {
      console.error('[dashboard.controller] summary error:', e.stack || e.message);
      res.status(500).json({ success: false, message: 'Failed to load dashboard summary', error: e.message });
    }
  },

  async revenueFlow(req, res) {
    try {
      const { from, to } = req.query;
      const data = await dashboardService.revenueFlow({ from, to });
      res.json(data);
    } catch (e) {
      console.error('[dashboard.controller] revenueFlow error:', e.stack || e.message);
      res.status(500).json({ success: false, message: 'Failed to load revenue flow', error: e.message });
    }
  },

  async topProducts(req, res) {
    try {
      const { from, to, limit, minSold } = req.query;
      const data = await dashboardService.topProductsByPeriod({ from, to, limit: Number(limit) || 5, minSold: Number(minSold) || 1 });
      res.json({ items: data });
    } catch (e) {
      console.error('[dashboard.controller] topProducts error:', e.stack || e.message);
      res.status(500).json({ success: false, message: 'Failed to load top products', error: e.message });
    }
  },
};
