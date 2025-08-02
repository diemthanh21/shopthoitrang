const express = require('express');
const router = express.Router();
const controller = require('../controllers/lichsutimkiem.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Lịch sử tìm kiếm
 *     description: Quản lý lịch sử tìm kiếm của khách hàng
 */

/**
 * @swagger
 * /api/lichsutimkiem:
 *   get:
 *     summary: Lấy tất cả lịch sử tìm kiếm
 *     tags: [Lịch sử tìm kiếm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/lichsutimkiem/{maLichSu}:
 *   get:
 *     summary: Lấy lịch sử tìm kiếm theo mã
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: maLichSu
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maLichSu', controller.getById);

/**
 * @swagger
 * /api/lichsutimkiem/khachhang/{maKhachHang}:
 *   get:
 *     summary: Lấy lịch sử tìm kiếm theo khách hàng
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: maKhachHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/khachhang/:maKhachHang', controller.getByKhachHang);

/**
 * @swagger
 * /api/lichsutimkiem:
 *   post:
 *     summary: Thêm lịch sử tìm kiếm mới
 *     tags: [Lịch sử tìm kiếm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maKhachHang
 *               - noiDung
 *             properties:
 *               maKhachHang:
 *                 type: string
 *               maChiTietSanPham:
 *                 type: string
 *               noiDung:
 *                 type: string
 *               thoiGianTK:
 *                 type: string
 *                 format: date-time
 *               maTuKhoa:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Tạo thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/lichsutimkiem/{maLichSu}:
 *   put:
 *     summary: Cập nhật lịch sử tìm kiếm
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: maLichSu
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noiDung:
 *                 type: string
 *               maTuKhoa:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi cập nhật
 */
router.put('/:maLichSu', controller.update);

/**
 * @swagger
 * /api/lichsutimkiem/{maLichSu}:
 *   delete:
 *     summary: Xoá lịch sử tìm kiếm
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: maLichSu
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maLichSu', controller.delete);

module.exports = router;
