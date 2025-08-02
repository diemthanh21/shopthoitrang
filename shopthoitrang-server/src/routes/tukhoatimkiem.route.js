const express = require('express');
const router = express.Router();
const controller = require('../controllers/tukhoatimkiem.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Từ khoá tìm kiếm
 *     description: Quản lý từ khoá được người dùng tìm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/tukhoatimkiem:
 *   get:
 *     summary: Lấy tất cả từ khoá
 *     tags: [Từ khoá tìm kiếm]
 *     responses:
 *       200:
 *         description: Danh sách từ khoá
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/tukhoatimkiem/{ma}:
 *   get:
 *     summary: Lấy từ khoá theo mã
 *     tags: [Từ khoá tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: ma
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:ma', controller.getById);

/**
 * @swagger
 * /api/tukhoatimkiem:
 *   post:
 *     summary: Tạo mới từ khoá
 *     tags: [Từ khoá tìm kiếm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tukhoa
 *             properties:
 *               tukhoa:
 *                 type: string
 *               luottim:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/tukhoatimkiem/{ma}:
 *   put:
 *     summary: Cập nhật từ khoá
 *     tags: [Từ khoá tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: ma
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tukhoa:
 *                 type: string
 *               luottim:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:ma', controller.update);

/**
 * @swagger
 * /api/tukhoatimkiem/{ma}:
 *   delete:
 *     summary: Xoá từ khoá
 *     tags: [Từ khoá tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: ma
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:ma', controller.delete);

module.exports = router;
