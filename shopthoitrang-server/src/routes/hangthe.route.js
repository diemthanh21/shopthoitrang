const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hangthe.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Hạng thẻ
 *     description: Quản lý hạng thẻ thành viên (Bạc, Vàng, Kim Cương)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/hangthe:
 *   get:
 *     summary: Lấy danh sách tất cả hạng thẻ
 *     tags: [Hạng thẻ]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/hangthe/{id}:
 *   get:
 *     summary: Lấy thông tin hạng thẻ theo ID
 *     tags: [Hạng thẻ]
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
 * /api/hangthe:
 *   post:
 *     summary: Tạo hạng thẻ mới
 *     tags: [Hạng thẻ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenhang, giamgia, voucher_sinhnhat]
 *             properties:
 *               tenhang: { type: string, example: "Bạc" }
 *               dieukien_nam: { type: number, example: 12000000 }
 *               dieukien_tichluy: { type: number, example: 20000000 }
 *               giamgia: { type: number, example: 10 }
 *               voucher_sinhnhat: { type: number, example: 200000 }
 *               uudai: { type: string, example: "Ưu đãi giảm 10%" }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/hangthe/{id}:
 *   put:
 *     summary: Cập nhật thông tin hạng thẻ
 *     tags: [Hạng thẻ]
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
 *               tenhang: { type: string }
 *               giamgia: { type: number }
 *               uudai: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/hangthe/{id}:
 *   delete:
 *     summary: Xoá hạng thẻ
 *     tags: [Hạng thẻ]
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
