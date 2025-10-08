const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietphieunhap.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết phiếu nhập
 *     description: Quản lý chi tiết phiếu nhập kho
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietphieunhap:
 *   get:
 *     summary: Lấy danh sách chi tiết phiếu nhập
 *     tags: [Chi tiết phiếu nhập]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chitietphieunhap/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu nhập theo mã
 *     tags: [Chi tiết phiếu nhập]
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
 * /api/chitietphieunhap:
 *   post:
 *     summary: Thêm chi tiết phiếu nhập mới
 *     tags: [Chi tiết phiếu nhập]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maphieunhap, machitietsanpham, soluong, dongianhap]
 *             properties:
 *               maphieunhap: { type: integer }
 *               machitietsanpham: { type: integer }
 *               soluong: { type: integer }
 *               dongianhap: { type: number }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietphieunhap/{id}:
 *   put:
 *     summary: Cập nhật chi tiết phiếu nhập
 *     tags: [Chi tiết phiếu nhập]
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
 *               dongianhap: { type: number }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chitietphieunhap/{id}:
 *   delete:
 *     summary: Xoá chi tiết phiếu nhập
 *     tags: [Chi tiết phiếu nhập]
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
