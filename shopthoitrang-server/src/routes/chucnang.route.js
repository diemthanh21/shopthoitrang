const express = require('express');
const router = express.Router();
const controller = require('../controllers/chucnang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chức năng
 *     description: Quản lý chức năng hệ thống
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chucnang:
 *   get:
 *     summary: Lấy danh sách tất cả chức năng
 *     tags: [Chức năng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chucnang/{id}:
 *   get:
 *     summary: Lấy chức năng theo mã
 *     tags: [Chức năng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chucnang:
 *   post:
 *     summary: Thêm chức năng mới
 *     tags: [Chức năng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               machucnang:
 *                 type: string
 *               tenchucnang:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chucnang/{id}:
 *   put:
 *     summary: Cập nhật chức năng
 *     tags: [Chức năng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenchucnang:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chucnang/{id}:
 *   delete:
 *     summary: Xoá chức năng
 *     tags: [Chức năng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:id', controller.delete);

module.exports = router;
