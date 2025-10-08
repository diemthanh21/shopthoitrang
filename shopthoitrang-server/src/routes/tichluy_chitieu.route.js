const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tichluy_chitieu.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Tích luỹ chi tiêu
 *     description: Quản lý điểm tích luỹ theo năm của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/tichluy_chitieu:
 *   get:
 *     summary: Lấy danh sách tất cả bản ghi tích luỹ chi tiêu
 *     tags: [Tích luỹ chi tiêu]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/tichluy_chitieu/{id}:
 *   get:
 *     summary: Lấy chi tiết bản ghi tích luỹ chi tiêu
 *     tags: [Tích luỹ chi tiêu]
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
 * /api/tichluy_chitieu:
 *   post:
 *     summary: Tạo mới bản ghi tích luỹ chi tiêu
 *     tags: [Tích luỹ chi tiêu]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makh, nam]
 *             properties:
 *               makh: { type: integer }
 *               nam: { type: integer }
 *               tongchi_nam: { type: number }
 *               tongchi_tichluy: { type: number }
 *               ngaycapnhat: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/tichluy_chitieu/{id}:
 *   put:
 *     summary: Cập nhật bản ghi tích luỹ chi tiêu
 *     tags: [Tích luỹ chi tiêu]
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
 *               tongchi_nam: { type: number }
 *               tongchi_tichluy: { type: number }
 *               ngaycapnhat: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/tichluy_chitieu/{id}:
 *   delete:
 *     summary: Xoá bản ghi tích luỹ chi tiêu
 *     tags: [Tích luỹ chi tiêu]
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
