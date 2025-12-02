const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Sản phẩm
 *     description: Quản lý thông tin sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/sanpham:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: query
 *         name: tensanpham
 *         schema: { type: string }
 *       - in: query
 *         name: madanhmuc
 *         schema: { type: integer }
 *       - in: query
 *         name: mathuonghieu
 *         schema: { type: integer }
 *       - in: query
 *         name: trangthai
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);
router.get('/count', ctrl.count);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Sản phẩm]
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
router.get('/:id/stats', ctrl.getStats);
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/sanpham:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tensanpham, madanhmuc]
 *             properties:
 *               tensanpham: { type: string }
 *               madanhmuc: { type: integer }
 *               mathuonghieu: { type: integer }
 *               trangthai: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Sản phẩm]
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
 *               tensanpham: { type: string }
 *               madanhmuc: { type: integer }
 *               mathuonghieu: { type: integer }
 *               trangthai: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   delete:
 *     summary: Xoá sản phẩm
 *     tags: [Sản phẩm]
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
