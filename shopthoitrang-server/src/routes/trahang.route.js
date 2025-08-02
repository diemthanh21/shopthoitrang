const express = require('express');
const router = express.Router();
const controller = require('../controllers/trahang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Trả hàng
 *     description: Quản lý yêu cầu trả hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/trahang:
 *   get:
 *     summary: Lấy tất cả yêu cầu trả hàng
 *     tags: [Trả hàng]
 *     responses:
 *       200:
 *         description: Danh sách trả hàng
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/trahang/donhang/{maDonHang}:
 *   get:
 *     summary: Lấy yêu cầu trả hàng theo mã đơn hàng
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/donhang/:maDonHang', controller.getByDonHang);

/**
 * @swagger
 * /api/trahang/{ma}:
 *   get:
 *     summary: Lấy yêu cầu trả hàng theo mã
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: ma
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:ma', controller.getById);

/**
 * @swagger
 * /api/trahang:
 *   post:
 *     summary: Tạo yêu cầu trả hàng mới
 *     tags: [Trả hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - madonhang
 *               - makhachhang
 *               - machitietsanpham
 *               - soluong
 *               - lydo
 *             properties:
 *               madonhang:
 *                 type: integer
 *               makhachhang:
 *                 type: integer
 *               machitietsanpham:
 *                 type: integer
 *               soluong:
 *                 type: integer
 *               lydo:
 *                 type: string
 *               hinhanhloi:
 *                 type: string
 *               ngayyeucau:
 *                 type: string
 *               trangthai:
 *                 type: string
 *               ghichu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/trahang/{ma}:
 *   put:
 *     summary: Cập nhật yêu cầu trả hàng
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: ma
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
 */
router.put('/:ma', controller.update);

/**
 * @swagger
 * /api/trahang/{ma}:
 *   delete:
 *     summary: Xoá yêu cầu trả hàng
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: ma
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:ma', controller.delete);

module.exports = router;
