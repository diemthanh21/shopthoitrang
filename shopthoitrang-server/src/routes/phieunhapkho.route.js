// routes/phieunhapkho.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/phieunhapkho.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phieu nhap kho
 *     description: Quan ly phieu nhap kho
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phieunhapkho:
 *   get:
 *     summary: Lay danh sach phieu nhap kho
 *     tags: [Phieu nhap kho]
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   get:
 *     summary: Lay phieu nhap kho theo ma
 *     tags: [Phieu nhap kho]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/phieunhapkho:
 *   post:
 *     summary: Tao phieu nhap kho moi
 *     tags: [Phieu nhap kho]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, maphieudathang]
 *             properties:
 *               manhanvien:
 *                 type: integer
 *                 example: 1
 *               maphieudathang:
 *                 type: integer
 *                 example: 42
 *               ngaynhap:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-10T00:00:00Z"
 *               trangthai:
 *                 type: string
 *                 enum: ['Tao moi', 'Dang xu ly', 'Hoan tat', 'Da huy']
 *                 example: "Tao moi"
 *               ghichu:
 *                 type: string
 *                 example: "Nhap lo hang ao khoac"
 *     responses:
 *       201:
 *         description: Tao thanh cong
 *       400:
 *         description: That bai
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   put:
 *     summary: Cap nhat phieu nhap kho
 *     tags: [Phieu nhap kho]
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
 *               manhanvien:
 *                 type: integer
 *               maphieudathang:
 *                 type: integer
 *               ngaynhap:
 *                 type: string
 *                 format: date-time
 *               trangthai:
 *                 type: string
 *                 enum: ['Tao moi', 'Dang xu ly', 'Hoan tat', 'Da huy']
 *               ghichu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/phieunhapkho/{id}:
 *   delete:
 *     summary: Xoa phieu nhap kho
 *     tags: [Phieu nhap kho]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoa thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.delete('/:id', controller.delete);

module.exports = router;
