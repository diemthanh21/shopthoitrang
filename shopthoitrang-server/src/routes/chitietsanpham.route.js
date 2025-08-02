const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết sản phẩm
 *     description: Quản lý chi tiết sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietsanpham:
 *   get:
 *     summary: Lấy tất cả chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo mã
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chitietsanpham/sanpham/{maSanPham}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo mã sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maSanPham
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/sanpham/:maSanPham', controller.getBySanPham);

/**
 * @swagger
 * /api/chitietsanpham/timkiem/{keyword}:
 *   get:
 *     summary: Tìm kiếm chi tiết sản phẩm theo mô tả
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/timkiem/:keyword', controller.searchByKeyword);

/**
 * @swagger
 * /api/chitietsanpham:
 *   post:
 *     summary: Tạo mới chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   put:
 *     summary: Cập nhật chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   delete:
 *     summary: Xoá chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:id', controller.delete);

module.exports = router;
