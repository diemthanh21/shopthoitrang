const express = require('express');
const router = express.Router();
const controller = require('../controllers/vaitrophu.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Vai trò phụ
 *     description: Quản lý vai trò phụ của nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/vaitrophu:
 *   get:
 *     summary: Lấy tất cả vai trò phụ
 *     tags: [Vai trò phụ]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/vaitrophu/{id}:
 *   get:
 *     summary: Lấy vai trò phụ theo mã
 *     tags: [Vai trò phụ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/vaitrophu:
 *   post:
 *     summary: Tạo vai trò phụ
 *     tags: [Vai trò phụ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manhanvien
 *               - machucnang
 *             properties:
 *               manhanvien:
 *                 type: integer
 *               machucnang:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Đã tạo
 *       400:
 *         description: Tạo thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/vaitrophu/{id}:
 *   put:
 *     summary: Cập nhật vai trò phụ
 *     tags: [Vai trò phụ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manhanvien:
 *                 type: integer
 *               machucnang:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đã cập nhật
 *       400:
 *         description: Lỗi
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/vaitrophu/{id}:
 *   delete:
 *     summary: Xoá vai trò phụ
 *     tags: [Vai trò phụ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Đã xoá
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:id', controller.delete);

module.exports = router;
