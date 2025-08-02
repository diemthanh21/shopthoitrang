const express = require('express');
const router = express.Router();
const controller = require('../controllers/ctbanner.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết banner
 *     description: Quản lý chi tiết nhân viên cập nhật banner
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/ctbanner:
 *   get:
 *     summary: Lấy tất cả lịch sử thay đổi banner
 *     tags: [Chi tiết banner]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/ctbanner/{maBanner}:
 *   get:
 *     summary: Lấy chi tiết theo mã banner
 *     tags: [Chi tiết banner]
 *     parameters:
 *       - in: path
 *         name: maBanner
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:maBanner', controller.getByMaBanner);

/**
 * @swagger
 * /api/ctbanner:
 *   post:
 *     summary: Thêm lịch sử thay đổi banner
 *     tags: [Chi tiết banner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mabanner
 *               - manhanvien
 *               - thoigiandoi
 *             properties:
 *               mabanner:
 *                 type: string
 *               manhanvien:
 *                 type: integer
 *               thoigiandoi:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Đã tạo thành công
 *       400:
 *         description: Tạo thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/ctbanner/{maBanner}/{maNhanVien}:
 *   delete:
 *     summary: Xoá lịch sử banner theo mã banner và nhân viên
 *     tags: [Chi tiết banner]
 *     parameters:
 *       - in: path
 *         name: maBanner
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: maNhanVien
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xoá
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maBanner/:maNhanVien', controller.delete);

module.exports = router;
