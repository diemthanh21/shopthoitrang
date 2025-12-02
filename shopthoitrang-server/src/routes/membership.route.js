const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/membership.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

// Lấy thông tin thẻ thành viên
router.get('/:makhachhang', ctrl.getMembershipCard);

// Lấy thông tin điểm tích lũy (pending, approved, năm)
router.get('/:makhachhang/points', ctrl.getPointsSummary);

// Lấy lịch sử giao dịch điểm
router.get('/:makhachhang/point-history', ctrl.getPointHistory);

// Duyệt điểm pending (admin hoặc scheduled job)
router.post('/approve-pending-points', ctrl.releasePendingPoints);

// Điều chỉnh điểm pending khi trả/đổi hàng
router.post('/adjust-pending', ctrl.adjustPendingPoints);

module.exports = router;
