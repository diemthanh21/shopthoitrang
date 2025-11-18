const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemlog.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * GET /api/system-logs
 * query: ?limit=100
 */
router.get('/', ctrl.list);

module.exports = router;
