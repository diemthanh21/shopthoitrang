const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thuonghieu.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Thương hiệu
 *     description: Quản lý danh sách thương hiệu sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/thuonghieu:
 *   get:
 *     summary: Lấy danh sách thương hiệu
 *     tags: [Thương hiệu]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/thuonghieu/{id}:
 *   get:
 *     summary: Lấy chi tiết thương hiệu
 *     tags: [Thương hiệu]
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
 * /api/thuonghieu:
 *   post:
 *     summary: Tạo thương hiệu mới
 *     tags: [Thương hiệu]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenthuonghieu]
 *             properties:
 *               tenthuonghieu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/thuonghieu/{id}:
 *   put:
 *     summary: Cập nhật thông tin thương hiệu
 *     tags: [Thương hiệu]
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
 *               tenthuonghieu: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/thuonghieu/{id}:
 *   delete:
 *     summary: Xoá thương hiệu
 *     tags: [Thương hiệu]
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
