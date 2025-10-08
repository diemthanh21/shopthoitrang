const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietphieudathang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết phiếu đặt hàng
 *     description: Quản lý chi tiết các phiếu đặt hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietphieudathang:
 *   get:
 *     summary: Lấy danh sách chi tiết phiếu đặt hàng
 *     tags: [Chi tiết phiếu đặt hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chitietphieudathang/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu đặt hàng theo mã
 *     tags: [Chi tiết phiếu đặt hàng]
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
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chitietphieudathang:
 *   post:
 *     summary: Thêm chi tiết phiếu đặt hàng mới
 *     tags: [Chi tiết phiếu đặt hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maphieudathang, machitietsanpham, soluong, dongia, thanhtien]
 *             properties:
 *               maphieudathang: { type: integer }
 *               machitietsanpham: { type: integer }
 *               soluong: { type: integer }
 *               dongia: { type: number }
 *               thanhtien: { type: number }
 *               ghichu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietphieudathang/{id}:
 *   put:
 *     summary: Cập nhật chi tiết phiếu đặt hàng
 *     tags: [Chi tiết phiếu đặt hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               soluong: { type: integer }
 *               dongia: { type: number }
 *               thanhtien: { type: number }
 *               ghichu: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chitietphieudathang/{id}:
 *   delete:
 *     summary: Xoá chi tiết phiếu đặt hàng
 *     tags: [Chi tiết phiếu đặt hàng]
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
router.delete('/:id', controller.delete);

module.exports = router;
