const express = require('express');
const router = express.Router();
const controller = require('../controllers/banner.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Banner
 *     description: Quản lý banner trong hệ thống
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/banner:
 *   get:
 *     summary: Lấy danh sách banner
 *     tags: [Banner]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/banner/{id}:
 *   get:
 *     summary: Lấy banner theo mã
 *     tags: [Banner]
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
 * /api/banner:
 *   post:
 *     summary: Tạo banner mới
 *     tags: [Banner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MABANNER, DUONGDANANH]
 *             properties:
 *               MABANNER:
 *                 type: string
 *               DUONGDANANH:
 *                 type: string
 *               MOTA:
 *                 type: string
 *               LIENKET:
 *                 type: string
 *               THUTUHIENTHI:
 *                 type: integer
 *               DANGHOATDONG:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/banner/{id}:
 *   put:
 *     summary: Cập nhật banner
 *     tags: [Banner]
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
 *               DUONGDANANH:
 *                 type: string
 *               MOTA:
 *                 type: string
 *               LIENKET:
 *                 type: string
 *               THUTUHIENTHI:
 *                 type: integer
 *               DANGHOATDONG:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/banner/{id}:
 *   delete:
 *     summary: Xoá banner
 *     tags: [Banner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:id', controller.delete);

/**
 * @swagger
 * /api/banner/trangthai/{status}:
 *   get:
 *     summary: Tìm banner theo trạng thái hoạt động
 *     tags: [Banner]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách banner
 */
router.get('/trangthai/:status', controller.searchByStatus);

module.exports = router;
