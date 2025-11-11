const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietdonhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết đơn hàng
 *     description: Quản lý chi tiết đơn hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietdonhang:
 *   get:
 *     summary: Lấy danh sách chi tiết đơn hàng
 *     tags: [Chi tiết đơn hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

// Lấy toàn bộ item theo mã đơn hàng
router.get('/donhang/:madonhang', controller.getByOrder);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng theo mã
 *     tags: [Chi tiết đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chitietdonhang:
 *   post:
 *     summary: Thêm chi tiết đơn hàng mới
 *     tags: [Chi tiết đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [madonhang, machitietsanpham, soluong, dongia]
 *             properties:
 *               madonhang: { type: integer }
 *               machitietsanpham: { type: integer }
 *               soluong: { type: integer }
 *               dongia: { type: number }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   put:
 *     summary: Cập nhật chi tiết đơn hàng
 *     tags: [Chi tiết đơn hàng]
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   delete:
 *     summary: Xoá chi tiết đơn hàng
 *     tags: [Chi tiết đơn hàng]
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
