const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phieudathang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phiếu đặt hàng
 *     description: Quản lý phiếu đặt hàng (Pre-order)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phieudathang:
 *   get:
 *     summary: Lấy danh sách phiếu đặt hàng
 *     tags: [Phiếu đặt hàng]
 *     parameters:
 *       - in: query
 *         name: makhachhang
 *         schema: { type: integer }
 *       - in: query
 *         name: trangthai
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/phieudathang/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu đặt hàng theo ID
 *     tags: [Phiếu đặt hàng]
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
 * /api/phieudathang:
 *   post:
 *     summary: Tạo phiếu đặt hàng mới
 *     tags: [Phiếu đặt hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, tongtien]
 *             properties:
 *               makhachhang: { type: integer }
 *               manhanvien: { type: integer, nullable: true }
 *               ngaydatphieu: { type: string, format: date-time }
 *               ngayhendukien: { type: string, format: date }
 *               tongtien: { type: number }
 *               tiencoc: { type: number }
 *               conlai: { type: number }
 *               phuongthucthanhtoan: { type: string }
 *               trangthaiphieu: { type: string }
 *               ghichu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/phieudathang/{id}:
 *   put:
 *     summary: Cập nhật phiếu đặt hàng
 *     tags: [Phiếu đặt hàng]
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
 *               tongtien: { type: number }
 *               tiencoc: { type: number }
 *               conlai: { type: number }
 *               trangthaiphieu: { type: string }
 *               ghichu: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/phieudathang/{id}:
 *   delete:
 *     summary: Xoá phiếu đặt hàng
 *     tags: [Phiếu đặt hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
