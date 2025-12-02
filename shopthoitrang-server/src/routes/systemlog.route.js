const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemlog.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * GET /api/system-logs
 * query: ?limit=100&userId=13
 */
router.get('/', ctrl.list);

/**
 * POST /api/system-logs/mark-read
 * body: { manhanvien, entity, entity_id, action }
 */
router.post('/mark-read', ctrl.markAsRead);

module.exports = router;
