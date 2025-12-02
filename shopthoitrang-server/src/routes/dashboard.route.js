const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/authorize.middleware');

// Protect all dashboard endpoints
router.use(authenticateToken);

// GET /api/dashboard/summary
router.get('/summary', ctrl.summary);

// GET /api/dashboard/revenue-flow (ADMIN/MANAGER only)
router.get('/revenue-flow', authorizeRoles('ADMIN', 'MANAGER'), ctrl.revenueFlow);

// GET /api/dashboard/top-products?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=5
router.get('/top-products', ctrl.topProducts);

// GET /api/dashboard/chart-data?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/chart-data', ctrl.chartData);

module.exports = router;
