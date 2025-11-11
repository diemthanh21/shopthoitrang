const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chat.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const { requireRole, requireAuthenticated, requireCustomer } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: API nhắn tin giữa khách hàng và nhân viên (Shopee-like)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chat/admin/boxes:
 *   get:
 *     summary: Admin/nhân viên lấy danh sách hộp thoại với tin mới nhất và số tin chưa đọc
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/admin/boxes', requireRole('employee','admin'), ctrl.listChatBoxes);

/**
 * @swagger
 * /api/chat/start:
 *   post:
 *     summary: Khách hàng bắt đầu (hoặc lấy) một hội thoại của mình
 *     tags: [Chat]
 *     responses:
 *       201:
 *         description: Tạo hoặc trả về chatbox
 */
router.post('/start', requireCustomer, ctrl.startChat);

/**
 * @swagger
 * /api/chat/messages/{machatbox}:
 *   get:
 *     summary: Lấy tin nhắn trong chatbox, có kèm thông tin nhân viên gửi (nếu có)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: machatbox
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Thành công }
 */
router.get('/messages/:machatbox', requireRole('employee','admin','customer'), ctrl.getMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Gửi tin nhắn (khách hàng hoặc nhân viên)
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machatbox, noidung]
 *             properties:
 *               machatbox: { type: integer }
 *               noidung: { type: string }
 *     responses:
 *       201: { description: Đã gửi }
 */
router.post('/send', requireRole('employee','admin','customer'), ctrl.sendMessage);

/**
 * @swagger
 * /api/chat/send-product:
 *   post:
 *     summary: Gửi tin nhắn dạng thẻ sản phẩm (snapshot) vào hội thoại
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machatbox, masanpham, tensanpham]
 *             properties:
 *               machatbox: { type: integer }
 *               masanpham: { type: integer }
 *               tensanpham: { type: string }
 *               hinhanh: { type: string }
 *               giaban: { type: number }
 *               kichco: { type: string }
 *               mausac: { type: string }
 *               soluong: { type: integer }
 *     responses:
 *       201: { description: Đã gửi }
 */
router.post('/send-product', requireRole('employee','admin','customer'), ctrl.sendProductMessage);

/**
 * @swagger
 * /api/chat/read/{id}:
 *   put:
 *     summary: Đánh dấu tin đã xem
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Thành công }
 */
router.put('/read/:id', requireRole('employee','admin','customer'), ctrl.markRead);

// Bulk mark all messages in chatbox as read
router.put('/read-all/:machatbox', requireRole('employee','admin','customer'), ctrl.markAllRead);

module.exports = router;
