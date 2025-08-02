const express = require('express');
const router = express.Router();
const controller = require('../controllers/hinhanhsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Hình ảnh sản phẩm
 *     description: Quản lý hình ảnh theo chi tiết sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/hinhanhsanpham:
 *   get:
 *     summary: Lấy tất cả hình ảnh sản phẩm
 *     tags: [Hình ảnh sản phẩm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/hinhanhsanpham/{maHinhAnh}:
 *   get:
 *     summary: Lấy hình ảnh theo mã
 *     tags: [Hình ảnh sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maHinhAnh
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maHinhAnh', controller.getById);

/**
 * @swagger
 * /api/hinhanhsanpham/chitiet/{maChiTietSanPham}:
 *   get:
 *     summary: Lấy hình ảnh theo mã chi tiết sản phẩm
 *     tags: [Hình ảnh sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maChiTietSanPham
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/chitiet/:maChiTietSanPham', controller.getByChiTietSanPham);

/**
 * @swagger
 * /api/hinhanhsanpham:
 *   post:
 *     summary: Thêm hình ảnh mới
 *     tags: [Hình ảnh sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               MAHINHANH:
 *                 type: string
 *               MACHITIETSANPHAM:
 *                 type: string
 *               DUONGDANHINHANH:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/hinhanhsanpham/{maHinhAnh}:
 *   put:
 *     summary: Cập nhật hình ảnh
 *     tags: [Hình ảnh sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maHinhAnh
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
 *               DUONGDANHINHANH:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:maHinhAnh', controller.update);

/**
 * @swagger
 * /api/hinhanhsanpham/{maHinhAnh}:
 *   delete:
 *     summary: Xoá hình ảnh
 *     tags: [Hình ảnh sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maHinhAnh
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:maHinhAnh', controller.delete);

module.exports = router;