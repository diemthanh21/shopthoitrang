const express = require('express');
const router = express.Router();
const controller = require('../controllers/huydonhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Huỷ đơn hàng
 *     description: Quản lý yêu cầu huỷ đơn hàng
 */

/**
 * @swagger
 * /api/huydonhang:
 *   get:
 *     summary: Lấy tất cả yêu cầu huỷ đơn hàng
 *     tags: [Huỷ đơn hàng]
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/huydonhang/{maHuyDon}:
 *   get:
 *     summary: Lấy thông tin huỷ theo mã
 *     tags: [Huỷ đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maHuyDon
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maHuyDon', controller.getById);

/**
 * @swagger
 * /api/huydonhang/donhang/{maDonHang}:
 *   get:
 *     summary: Lấy các yêu cầu huỷ theo mã đơn hàng
 *     tags: [Huỷ đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/donhang/:maDonHang', controller.getByMaDonHang);

/**
 * @swagger
 * /api/huydonhang:
 *   post:
 *     summary: Gửi yêu cầu huỷ đơn
 *     tags: [Huỷ đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maDonHang
 *               - maKhachHang
 *               - lyDo
 *             properties:
 *               maDonHang:
 *                 type: string
 *               maKhachHang:
 *                 type: string
 *               lyDo:
 *                 type: string
 *               ngayYeuCau:
 *                 type: string
 *                 format: date
 *               trangThai:
 *                 type: string
 *               ghiChu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công
 *       400:
 *         description: Lỗi tạo yêu cầu
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/huydonhang/{maHuyDon}:
 *   put:
 *     summary: Cập nhật thông tin huỷ đơn
 *     tags: [Huỷ đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maHuyDon
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trangThai:
 *                 type: string
 *               ghiChu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:maHuyDon', controller.update);

/**
 * @swagger
 * /api/huydonhang/{maHuyDon}:
 *   delete:
 *     summary: Xoá yêu cầu huỷ đơn
 *     tags: [Huỷ đơn hàng]
 *     parameters:
 *       - in: path
 *         name: maHuyDon
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maHuyDon', controller.delete);

module.exports = router;
