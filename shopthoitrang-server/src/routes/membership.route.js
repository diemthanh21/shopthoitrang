const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/membership.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);
router.get('/:makhachhang', ctrl.getMembershipCard);

module.exports = router;
