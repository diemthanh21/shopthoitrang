const express = require('express');
const router = express.Router();
const controller = require('../controllers/nhacungcap.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Nhà cung cấp
 *     description: Quản lý nhà cung cấp
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/nhacungcap:
 *   get:
 *     summary: Lấy tất cả nhà cung cấp
 *     tags: [Nhà cung cấp]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/nhacungcap/timkiem:
 *   get:
 *     summary: Tìm nhà cung cấp theo tên
 *     tags: [Nhà cung cấp]
 *     parameters:
 *       - in: query
 *         name: ten
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Danh sách nhà cung cấp
 */
router.get('/timkiem', controller.search);

/**
 * @swagger
 * /api/nhacungcap/{maNhaCungCap}:
 *   get:
 *     summary: Lấy nhà cung cấp theo mã
 *     tags: [Nhà cung cấp]
 *     parameters:
 *       - in: path
 *         name: maNhaCungCap
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maNhaCungCap', controller.getById);

/**
 * @swagger
 * /api/nhacungcap:
 *   post:
 *     summary: Tạo mới nhà cung cấp
 *     tags: [Nhà cung cấp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhacungcap, tennhacungcap]
 *             properties:
 *               manhacungcap:
 *                 type: string
 *               tennhacungcap:
 *                 type: string
 *               thongtinlienhe:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Tạo thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/nhacungcap/{maNhaCungCap}:
 *   put:
 *     summary: Cập nhật nhà cung cấp
 *     tags: [Nhà cung cấp]
 *     parameters:
 *       - in: path
 *         name: maNhaCungCap
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tennhacungcap:
 *                 type: string
 *               thongtinlienhe:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Cập nhật thất bại
 */
router.put('/:maNhaCungCap', controller.update);

/**
 * @swagger
 * /api/nhacungcap/{maNhaCungCap}:
 *   delete:
 *     summary: Xoá nhà cung cấp
 *     tags: [Nhà cung cấp]
 *     parameters:
 *       - in: path
 *         name: maNhaCungCap
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maNhaCungCap', controller.delete);

module.exports = router;
