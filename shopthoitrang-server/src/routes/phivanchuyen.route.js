const express = require('express');
const router = express.Router();
const controller = require('../controllers/phivanchuyen.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * Public read endpoints (no auth required so mobile/web can fetch fees)
 */
router.get('/', controller.getConfig);
router.get('/estimate', controller.estimate);

/**
 * Admin update requires auth
 */
router.put('/', authenticateToken, controller.updateConfig);

module.exports = router;
