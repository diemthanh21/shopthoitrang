const express = require('express');
const router = express.Router();
const controller = require('../controllers/danhmucsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Danh mục sản phẩm
 *     description: Quản lý danh mục sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/danhmucsanpham:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     tags: [Danh mục sản phẩm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/danhmucsanpham/{maDanhMuc}:
 *   get:
 *     summary: Lấy danh mục theo mã
 *     tags: [Danh mục sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maDanhMuc
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maDanhMuc', controller.getById);

/**
 * @swagger
 * /api/danhmucsanpham:
 *   post:
 *     summary: Tạo mới danh mục
 *     tags: [Danh mục sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [madanhmuc, tendanhmuc]
 *             properties:
 *               madanhmuc:
 *                 type: string
 *               tendanhmuc:
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
 * /api/danhmucsanpham/{maDanhMuc}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Danh mục sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maDanhMuc
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tendanhmuc:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:maDanhMuc', controller.update);

/**
 * @swagger
 * /api/danhmucsanpham/{maDanhMuc}:
 *   delete:
 *     summary: Xoá danh mục
 *     tags: [Danh mục sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maDanhMuc
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maDanhMuc', controller.delete);

module.exports = router;
