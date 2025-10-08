const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/magiamgia.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Mã giảm giá
 *     description: Quản lý voucher và mã giảm giá
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/magiamgia:
 *   get:
 *     summary: Lấy danh sách mã giảm giá
 *     tags: [Mã giảm giá]
 *     parameters:
 *       - in: query
 *         name: macode
 *         schema: { type: string }
 *         description: Tìm kiếm theo mã
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Lọc theo trạng thái còn hiệu lực
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   get:
 *     summary: Lấy thông tin mã giảm giá theo ID
 *     tags: [Mã giảm giá]
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
 * /api/magiamgia:
 *   post:
 *     summary: Tạo mã giảm giá mới
 *     tags: [Mã giảm giá]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [macode, giatrigiam, soluong, ngaybatdau, ngayketthuc, manhanvien]
 *             properties:
 *               macode: { type: string }
 *               madonhang: { type: integer, nullable: true }
 *               mota: { type: string }
 *               giatrigiam: { type: number, example: 10.0 }
 *               soluong: { type: integer, example: 50 }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               manhanvien: { type: integer }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   put:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Mã giảm giá]
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
 *               macode: { type: string }
 *               mota: { type: string }
 *               giatrigiam: { type: number }
 *               soluong: { type: integer }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               manhanvien: { type: integer }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   delete:
 *     summary: Xoá mã giảm giá
 *     tags: [Mã giảm giá]
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
