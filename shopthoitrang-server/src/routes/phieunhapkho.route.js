const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phieunhapkho.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phiếu nhập kho
 *     description: Quản lý phiếu nhập hàng từ nhà cung cấp
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phieunhapkho:
 *   get:
 *     summary: Lấy danh sách phiếu nhập kho
 *     tags: [Phiếu nhập kho]
 *     parameters:
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *       - in: query
 *         name: manhacungcap
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu nhập kho theo ID
 *     tags: [Phiếu nhập kho]
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
 * /api/phieunhapkho:
 *   post:
 *     summary: Tạo phiếu nhập kho mới
 *     tags: [Phiếu nhập kho]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, manhacungcap]
 *             properties:
 *               manhanvien: { type: integer }
 *               manhacungcap: { type: integer }
 *               ngaynhap: { type: string, format: date-time }
 *               thanhtien: { type: number }
 *               ghichu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   put:
 *     summary: Cập nhật phiếu nhập kho
 *     tags: [Phiếu nhập kho]
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
 *               thanhtien: { type: number }
 *               ghichu: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   delete:
 *     summary: Xoá phiếu nhập kho
 *     tags: [Phiếu nhập kho]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
