// routes/phieunhapkho.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/phieunhapkho.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phiếu nhập kho
 *     description: Quản lý phiếu nhập kho
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phieunhapkho:
 *   get:
 *     summary: Lấy danh sách phiếu nhập kho
 *     tags: [Phiếu nhập kho]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   get:
 *     summary: Lấy phiếu nhập kho theo mã
 *     tags: [Phiếu nhập kho]
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
 * /api/phieunhapkho:
 *   post:
 *     summary: Thêm phiếu nhập kho mới
 *     tags: [Phiếu nhập kho]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, manhacungcap]
 *             properties:
 *               manhanvien:
 *                 type: integer
 *                 example: 1
 *               manhacungcap:
 *                 type: integer
 *                 example: 2
 *               ngaynhap:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-10T00:00:00Z"
 *               trangthai:
 *                 type: string
 *                 enum: ['Tạo mới', 'Đang xử lý', 'Hoàn tất', 'Đã hủy']
 *                 example: "Tạo mới"
 *               ghichu:
 *                 type: string
 *                 example: "Nhập lô hàng áo khoác"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   put:
 *     summary: Cập nhật phiếu nhập kho
 *     tags: [Phiếu nhập kho]
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
 *               manhanvien:
 *                 type: integer
 *               manhacungcap:
 *                 type: integer
 *               ngaynhap:
 *                 type: string
 *                 format: date-time
 *               trangthai:
 *                 type: string
 *                 enum: ['Tạo mới', 'Đang xử lý', 'Hoàn tất', 'Đã hủy']
 *               ghichu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   delete:
 *     summary: Xoá phiếu nhập kho
 *     tags: [Phiếu nhập kho]
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
