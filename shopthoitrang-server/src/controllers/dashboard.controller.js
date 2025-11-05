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
};
