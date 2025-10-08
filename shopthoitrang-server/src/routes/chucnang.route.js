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

/**
 * @swagger
 * components:
 *   schemas:
 *     ChucNang:
 *       type: object
 *       properties:
 *         machucnang:
 *           type: integer
 *           example: 1
 *         tenchucnang:
 *           type: string
 *           example: Quản lý đơn hàng
 *     NewChucNang:
 *       type: object
 *       required:
 *         - tenchucnang
 *       properties:
 *         tenchucnang:
 *           type: string
 *           example: Quản lý kho
 *     UpdateChucNang:
 *       type: object
 *       properties:
 *         tenchucnang:
 *           type: string
 *           example: Quản lý kho (cập nhật)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChucNang'
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChucNang'
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
 *             $ref: '#/components/schemas/NewChucNang'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChucNang'
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
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateChucNang'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChucNang'
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
 *           type: integer
 *     responses:
 *       204:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', controller.delete);

module.exports = router;
