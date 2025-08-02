const express = require('express');
const router = express.Router();
const controller = require('../controllers/donhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// 🔐 Áp dụng middleware xác thực cho tất cả route
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Đơn hàng
 *     description: Quản lý đơn hàng
 */

/**
 * @swagger
 * /api/donhang:
 *   get:
 *     summary: Lấy danh sách tất cả đơn hàng
 *     tags: [Đơn hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/donhang/{maDonHang}:
 *   get:
 *     summary: Lấy thông tin đơn hàng theo mã
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maDonHang', controller.getById);

/**
 * @swagger
 * /api/donhang/khachhang/{maKhachHang}:
 *   get:
 *     summary: Lấy đơn hàng theo mã khách hàng
 *     tags: [Đơn hàng]
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
router.get('/khachhang/:maKhachHang', controller.getByMaKhachHang);

/**
 * @swagger
 * /api/donhang:
 *   post:
 *     summary: Tạo mới đơn hàng
 *     tags: [Đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maKhachHang
 *               - ngayDatHang
 *               - thanhTien
 *             properties:
 *               maKhachHang:
 *                 type: string
 *               ngayDatHang:
 *                 type: string
 *                 format: date
 *               thanhTien:
 *                 type: number
 *               phuongThucThanhToan:
 *                 type: string
 *               trangThaiThanhToan:
 *                 type: string
 *               trangThaiDonHang:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *       400:
 *         description: Lỗi tạo đơn hàng
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/donhang/{maDonHang}:
 *   put:
 *     summary: Cập nhật đơn hàng
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               thanhTien:
 *                 type: number
 *               phuongThucThanhToan:
 *                 type: string
 *               trangThaiThanhToan:
 *                 type: string
 *               trangThaiDonHang:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:maDonHang', controller.update);

/**
 * @swagger
 * /api/donhang/{maDonHang}:
 *   delete:
 *     summary: Xoá đơn hàng theo mã
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maDonHang', controller.delete);

module.exports = router;
