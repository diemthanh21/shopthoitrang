// routes/nhanvien.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/nhanvien.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/nhanvien:
 *   get:
 *     summary: Lấy danh sách nhân viên
 *     tags:
 *       - Nhân viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách nhân viên
 */
router.get('/', authenticateToken, controller.getAll);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   get:
 *     summary: Lấy thông tin nhân viên theo ID
 *     tags:
 *       - Nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin nhân viên
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.get('/:id', authenticateToken, controller.getById);

/**
 * @swagger
 * /api/nhanvien:
 *   post:
 *     summary: Thêm mới nhân viên
 *     tags:
 *       - Nhân viên
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten:
 *                 type: string
 *               tuoi:
 *                 type: integer
 *             
 *     responses:
 *       201:
 *         description: Tạo nhân viên thành công
 */
router.post('/', authenticateToken, controller.create);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   put:
 *     summary: Cập nhật thông tin nhân viên
 *     tags:
 *       - Nhân viên
 *     security:
 *       - bearerAuth: []
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
 *               ten:
 *                 type: string
 *               tuoi:
 *                 type: integer
 *              
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.put('/:id', authenticateToken, controller.update);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   delete:
 *     summary: Xóa nhân viên
 *     tags:
 *       - Nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.delete('/:id', authenticateToken, controller.delete);

module.exports = router;
