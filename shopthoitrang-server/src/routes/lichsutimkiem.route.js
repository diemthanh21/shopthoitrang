const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lichsutimkiem.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Lịch sử tìm kiếm
 *     description: Quản lý lịch sử từ khoá khách hàng đã tìm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/lichsutimkiem:
 *   get:
 *     summary: Lấy danh sách lịch sử tìm kiếm (hỗ trợ lọc)
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: query
 *         name: makhachhang
 *         schema:
 *           type: integer
 *       - in: query
 *         name: machitietsanpham
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "ISO datetime bắt đầu (VD: 2025-01-01T00:00:00.000Z)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "ISO datetime kết thúc"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/lichsutimkiem/{id}:
 *   get:
 *     summary: Lấy lịch sử tìm kiếm theo ID
 *     tags: [Lịch sử tìm kiếm]
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
 * /api/lichsutimkiem/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy tất cả lịch sử tìm kiếm theo khách hàng
 *     tags: [Lịch sử tìm kiếm]
 *     parameters:
 *       - in: path
 *         name: makhachhang
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/khachhang/:makhachhang', ctrl.getByCustomer);

/**
 * @swagger
 * /api/lichsutimkiem:
 *   post:
 *     summary: Tạo bản ghi lịch sử tìm kiếm mới
 *     tags: [Lịch sử tìm kiếm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, noidung]
 *             properties:
 *               makhachhang: { type: integer }
 *               machitietsanpham: { type: integer, nullable: true }
 *               noidung: { type: string }
 *               thoigiantk: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/lichsutimkiem/{id}:
 *   put:
 *     summary: Cập nhật lịch sử tìm kiếm
 *     tags: [Lịch sử tìm kiếm]
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
 *               machitietsanpham: { type: integer, nullable: true }
 *               noidung: { type: string }
 *               thoigiantk: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/lichsutimkiem/{id}:
 *   delete:
 *     summary: Xoá lịch sử tìm kiếm
 *     tags: [Lịch sử tìm kiếm]
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