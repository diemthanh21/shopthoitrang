const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hinhanhsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Hình ảnh sản phẩm
 *     description: Quản lý hình ảnh của sản phẩm
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
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/hinhanhsanpham/{id}:
 *   get:
 *     summary: Lấy hình ảnh sản phẩm theo ID
 *     tags: [Hình ảnh sản phẩm]
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
 * /api/hinhanhsanpham/sanpham/{machitietsanpham}:
 *   get:
 *     summary: Lấy danh sách hình ảnh theo mã chi tiết sản phẩm
 *     tags: [Hình ảnh sản phẩm]
 *     parameters:
 *       - in: path
 *         name: machitietsanpham
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/sanpham/:machitietsanpham', ctrl.getByProductDetail);

/**
 * @swagger
 * /api/hinhanhsanpham:
 *   post:
 *     summary: Thêm hình ảnh sản phẩm mới
 *     tags: [Hình ảnh sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machitietsanpham, duongdanhinhanh]
 *             properties:
 *               machitietsanpham: { type: integer }
 *               duongdanhinhanh: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/hinhanhsanpham/{id}:
 *   put:
 *     summary: Cập nhật hình ảnh sản phẩm
 *     tags: [Hình ảnh sản phẩm]
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
 *               duongdanhinhanh: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/hinhanhsanpham/{id}:
 *   delete:
 *     summary: Xoá hình ảnh sản phẩm
 *     tags: [Hình ảnh sản phẩm]
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
