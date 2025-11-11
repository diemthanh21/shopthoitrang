const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/danhgia.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Đánh giá
 *     description: Quản lý đánh giá sản phẩm của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/danhgia:
 *   get:
 *     summary: Lấy danh sách đánh giá
 *     tags: [Đánh giá]
 *     parameters:
 *       - in: query
 *         name: masanpham
 *         schema: { type: integer }
 *       - in: query
 *         name: makhachhang
 *         schema: { type: integer }
 *       - in: query
 *         name: diemdanhgia
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   get:
 *     summary: Lấy thông tin đánh giá theo ID
 *     tags: [Đánh giá]
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
 * /api/danhgia:
 *   post:
 *     summary: Tạo đánh giá mới
 *     tags: [Đánh giá]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [masanpham, makhachhang, diemdanhgia]
 *             properties:
 *               masanpham: { type: integer }
 *               makhachhang: { type: integer }
 *               diemdanhgia: { type: integer, minimum: 1, maximum: 5 }
 *               binhluan: { type: string }
 *               hinhanh: { type: string }
 *               phanhoitushop: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Đánh giá]
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
 *               diemdanhgia: { type: integer }
 *               binhluan: { type: string }
 *               phanhoitushop: { type: string }
 *               hinhanh: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/danhgia/{id}/mark-read:
 *   patch:
 *     summary: Đánh dấu đánh giá là đã đọc (admin)
 *     tags: [Đánh giá]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *       404:
 *         description: Không tìm thấy
 */
router.patch('/:id/mark-read', ctrl.markAsRead);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   delete:
 *     summary: Xoá đánh giá
 *     tags: [Đánh giá]
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
