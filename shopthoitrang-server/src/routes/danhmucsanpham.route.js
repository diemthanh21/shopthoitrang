const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/danhmucsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Danh mục sản phẩm
 *     description: Quản lý danh mục sản phẩm trong hệ thống
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/danhmucsanpham:
 *   get:
 *     summary: Lấy danh sách danh mục sản phẩm
 *     tags: [Danh mục sản phẩm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/danhmucsanpham/{id}:
 *   get:
 *     summary: Lấy thông tin danh mục theo ID
 *     tags: [Danh mục sản phẩm]
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
 * /api/danhmucsanpham:
 *   post:
 *     summary: Tạo danh mục sản phẩm mới
 *     tags: [Danh mục sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tendanhmuc]
 *             properties:
 *               tendanhmuc: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/danhmucsanpham/{id}:
 *   put:
 *     summary: Cập nhật danh mục sản phẩm
 *     tags: [Danh mục sản phẩm]
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
 *               tendanhmuc: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/danhmucsanpham/{id}:
 *   delete:
 *     summary: Xoá danh mục sản phẩm
 *     tags: [Danh mục sản phẩm]
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
