const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nhacungcap.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Nhà cung cấp
 *     description: Quản lý thông tin nhà cung cấp
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/nhacungcap:
 *   get:
 *     summary: Lấy danh sách nhà cung cấp
 *     tags: [Nhà cung cấp]
 *     parameters:
 *       - in: query
 *         name: tennhacungcap
 *         schema: { type: string }
 *         description: Tìm theo tên nhà cung cấp
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/nhacungcap/{id}:
 *   get:
 *     summary: Lấy chi tiết nhà cung cấp theo ID
 *     tags: [Nhà cung cấp]
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
 * /api/nhacungcap:
 *   post:
 *     summary: Tạo nhà cung cấp mới
 *     tags: [Nhà cung cấp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tennhacungcap]
 *             properties:
 *               tennhacungcap: { type: string }
 *               email:        { type: string, nullable: true }
 *               diachi:       { type: string, nullable: true }
 *               sodienthoai:  { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/nhacungcap/{id}:
 *   put:
 *     summary: Cập nhật thông tin nhà cung cấp
 *     tags: [Nhà cung cấp]
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
 *               tennhacungcap: { type: string }
 *               email:        { type: string }
 *               diachi:       { type: string }
 *               sodienthoai:  { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/nhacungcap/{id}:
 *   delete:
 *     summary: Xoá nhà cung cấp
 *     tags: [Nhà cung cấp]
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
