const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/noidungchat.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Nội dung chat
 *     description: Quản lý tin nhắn trong chatbox
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/noidungchat:
 *   get:
 *     summary: Lấy danh sách tin nhắn (hỗ trợ lọc)
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: query
 *         name: machatbox
 *         schema: { type: integer }
 *       - in: query
 *         name: nguoigui
 *         schema: { type: string, enum: ["KH","NV"] }
 *       - in: query
 *         name: daxem
 *         schema: { type: string, enum: ["true","false"] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/noidungchat/{id}:
 *   get:
 *     summary: Lấy tin nhắn theo ID
 *     tags: [Nội dung chat]
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
 * /api/noidungchat/chatbox/{machatbox}:
 *   get:
 *     summary: Lấy tất cả tin nhắn theo mã chatbox
 *     tags: [Nội dung chat]
 *     parameters:
 *       - in: path
 *         name: machatbox
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/chatbox/:machatbox', ctrl.getByChatBox);

/**
 * @swagger
 * /api/noidungchat:
 *   post:
 *     summary: Tạo tin nhắn mới
 *     tags: [Nội dung chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machatbox, nguoigui, noidung]
 *             properties:
 *               machatbox: { type: integer }
 *               nguoigui: { type: string, enum: ["KH","NV"] }
 *               noidung: { type: string }
 *               thoigiangui: { type: string, format: date-time }
 *               daxem: { type: boolean }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/noidungchat/{id}:
 *   put:
 *     summary: "Cập nhật tin nhắn (VD: đánh dấu đã xem)"
 *     tags: [Nội dung chat]
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
 *               noidung: { type: string }
 *               daxem: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/noidungchat/{id}:
 *   delete:
 *     summary: Xoá tin nhắn
 *     tags: [Nội dung chat]
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