const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Đơn hàng
 *     description: Quản lý đơn hàng của khách hàng
 */

router.use(authenticateToken);

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
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/donhang/{id}:
 *   get:
 *     summary: Lấy đơn hàng theo ID
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/donhang/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo khách hàng
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: makhachhang
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/khachhang/:makhachhang', ctrl.getByCustomer);

/**
 * @swagger
 * /api/donhang:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, phuongthucthanhtoan]
 *             properties:
 *               makhachhang: { type: integer }
 *               manhanvien: { type: integer, description: "Mã nhân viên xử lý đơn hàng (tùy chọn)" }
 *               thanhtien: { type: number }
 *               phuongthucthanhtoan: { type: string }
 *               trangthaithanhtoan: { type: string }
 *               trangthaidonhang: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/donhang/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manhanvien: { type: integer, description: "Mã nhân viên xử lý đơn hàng" }
 *               trangthaithanhtoan: { type: string }
 *               trangthaidonhang: { type: string }
 *               thanhtien: { type: number }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/donhang/{id}:
 *   delete:
 *     summary: Xoá đơn hàng
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
