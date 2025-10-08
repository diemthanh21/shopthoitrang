const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Protect all dashboard endpoints
router.use(authenticateToken);

// GET /api/dashboard/summary
router.get('/summary', ctrl.summary);

module.exports = router;
