const express = require('express');
const router = express.Router();
const controller = require('../controllers/noidungchat.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Nội dung chat
 *     description: Quản lý tin nhắn trong chat box
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/noidungchat:
 *   get:
 *     summary: Lấy tất cả nội dung chat
 *     tags: [Nội dung chat]
 *     responses:
 *       200:
 *         description: Danh sách nội dung chat
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/noidungchat/chatbox/{maChatBox}:
 *   get:
 *     summary: Lấy nội dung chat theo mã chat box
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: path
 *         name: maChatBox
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/chatbox/:maChatBox', controller.getByChatBox);

/**
 * @swagger
 * /api/noidungchat/{maChat}:
 *   get:
 *     summary: Lấy nội dung chat theo mã
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: path
 *         name: maChat
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:maChat', controller.getById);

/**
 * @swagger
 * /api/noidungchat:
 *   post:
 *     summary: Tạo nội dung chat mới
 *     tags: [Nội dung chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               machatbox:
 *                 type: integer
 *               nguoigui:
 *                 type: string
 *               noidung:
 *                 type: string
 *               thoigiangui:
 *                 type: string
 *               daxem:
 *                 type: boolean
 *               ghichu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/noidungchat/{maChat}:
 *   put:
 *     summary: Cập nhật nội dung chat
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: path
 *         name: maChat
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
 *               noidung:
 *                 type: string
 *               daxem:
 *                 type: boolean
 *               ghichu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:maChat', controller.update);

/**
 * @swagger
 * /api/noidungchat/{maChat}:
 *   delete:
 *     summary: Xoá nội dung chat
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: path
 *         name: maChat
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
router.delete('/:maChat', controller.delete);

module.exports = router;
