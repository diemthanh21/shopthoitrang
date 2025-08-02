const express = require('express');
const router = express.Router();
const controller = require('../controllers/magiamgia.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Mã giảm giá
 *     description: Quản lý mã voucher
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/magiamgia:
 *   get:
 *     summary: Lấy danh sách mã giảm giá
 *     tags: [Mã giảm giá]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/magiamgia/{maVoucher}:
 *   get:
 *     summary: Lấy mã giảm giá theo mã
 *     tags: [Mã giảm giá]
 *     parameters:
 *       - in: path
 *         name: maVoucher
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maVoucher', controller.getById);

/**
 * @swagger
 * /api/magiamgia:
 *   post:
 *     summary: Tạo mới mã giảm giá
 *     tags: [Mã giảm giá]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               macode:
 *                 type: string
 *               madonhang:
 *                 type: integer
 *               mota:
 *                 type: string
 *               giatrigiam:
 *                 type: number
 *               soluong:
 *                 type: integer
 *               ngaybatdau:
 *                 type: string
 *               ngayketthuc:
 *                 type: string
 *               manhanvien:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/magiamgia/{maVoucher}:
 *   put:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Mã giảm giá]
 *     parameters:
 *       - in: path
 *         name: maVoucher
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
 *               mota:
 *                 type: string
 *               giatrigiam:
 *                 type: number
 *               soluong:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:maVoucher', controller.update);

/**
 * @swagger
 * /api/magiamgia/{maVoucher}:
 *   delete:
 *     summary: Xoá mã giảm giá
 *     tags: [Mã giảm giá]
 *     parameters:
 *       - in: path
 *         name: maVoucher
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maVoucher', controller.delete);

module.exports = router;
