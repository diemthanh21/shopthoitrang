const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbox.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chatbox
 *     description: Quản lý hội thoại giữa khách hàng và nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chatbox:
 *   get:
 *     summary: Lấy danh sách tất cả chatbox
 *     tags: [Chatbox]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chatbox/{id}:
 *   get:
 *     summary: Lấy thông tin chatbox theo mã
 *     tags: [Chatbox]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chatbox:
 *   post:
 *     summary: Tạo chatbox mới
 *     tags: [Chatbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, manhanvien]
 *             properties:
 *               makhachhang:
 *                 type: integer
 *               manhanvien:
 *                 type: integer
 *               trangthai:
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
 * /api/chatbox/{id}:
 *   put:
 *     summary: Cập nhật chatbox
 *     tags: [Chatbox]
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
 *             type: object
 *             properties:
 *               trangthai:
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
 * /api/chatbox/{id}:
 *   delete:
 *     summary: Xoá chatbox
 *     tags: [Chatbox]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:id', controller.delete);

module.exports = router;
