const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lichsudonhang.controller');

/**
 * @swagger
 * /api/lichsudonhang:
 *   get:
 *     summary: Lấy danh sách lịch sử đơn hàng
 *     tags: [LichSuDonHang]
 *     parameters:
 *       - in: query
 *         name: madonhang
 *         schema:
 *           type: integer
 *         description: Mã đơn hàng cần xem lịch sử
 *       - in: query
 *         name: manhanvien
 *         schema:
 *           type: integer
 *         description: Mã nhân viên thực hiện thay đổi
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Từ ngày
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Đến ngày
 *     responses:
 *       200:
 *         description: Danh sách lịch sử
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/lichsudonhang/order/{madonhang}:
 *   get:
 *     summary: Lấy lịch sử của 1 đơn hàng
 *     tags: [LichSuDonHang]
 *     parameters:
 *       - in: path
 *         name: madonhang
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mã đơn hàng
 *     responses:
 *       200:
 *         description: Lịch sử đơn hàng
 */
router.get('/order/:madonhang', ctrl.getByOrder);

module.exports = router;
