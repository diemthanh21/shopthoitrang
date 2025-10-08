const express = require('express');
const router = express.Router();
const controller = require('../controllers/huydonhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Hủy đơn hàng
 *     description: Quản lý yêu cầu hủy đơn hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/huydonhang:
 *   get:
 *     summary: Lấy danh sách yêu cầu hủy đơn hàng
 *     tags: [Hủy đơn hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/huydonhang/{id}:
 *   get:
 *     summary: Lấy thông tin hủy đơn hàng theo mã
 *     tags: [Hủy đơn hàng]
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
 * /api/huydonhang:
 *   post:
 *     summary: Tạo yêu cầu hủy đơn hàng mới
 *     tags: [Hủy đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               madonhang:
 *                 type: integer
 *               makhachhang:
 *                 type: integer
 *               lydo:
 *                 type: string
 *               trangthai:
 *                 type: string
 *               ghichu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/huydonhang/{id}:
 *   put:
 *     summary: Cập nhật yêu cầu hủy đơn hàng
 *     tags: [Hủy đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trangthai:
 *                 type: string
 *               ghichu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/huydonhang/{id}:
 *   delete:
 *     summary: Xóa yêu cầu hủy đơn hàng
 *     tags: [Hủy đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Xóa thất bại
 */
router.delete('/:id', controller.delete);

module.exports = router;
