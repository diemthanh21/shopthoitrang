const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phancongca.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phân công ca
 *     description: Quản lý phân công ca làm việc cho nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phancongca:
 *   get:
 *     summary: Lấy danh sách phân công ca (hỗ trợ lọc)
 *     tags: [Phân công ca]
 *     parameters:
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *       - in: query
 *         name: maca
 *         schema: { type: integer }
 *       - in: query
 *         name: trangthai
 *         schema: { type: string, example: "Đã phân công" }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Lọc từ ngày làm việc (YYYY-MM-DD)"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "Lọc đến ngày làm việc (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/phancongca/{id}:
 *   get:
 *     summary: Lấy chi tiết phân công ca theo ID
 *     tags: [Phân công ca]
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
 * /api/phancongca/nhanvien/{manhanvien}:
 *   get:
 *     summary: Lấy phân công ca theo nhân viên (có thể lọc theo khoảng ngày)
 *     tags: [Phân công ca]
 *     parameters:
 *       - in: path
 *         name: manhanvien
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/nhanvien/:manhanvien', ctrl.getByNhanVien);

/**
 * @swagger
 * /api/phancongca:
 *   post:
 *     summary: Tạo phân công ca mới
 *     tags: [Phân công ca]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, maca, ngaylamviec]
 *             properties:
 *               manhanvien: { type: integer }
 *               maca: { type: integer }
 *               ngaylamviec: { type: string, format: date }
 *               trangthai: { type: string, example: "Đã phân công" }
 *               ghichu: { type: string }
 *               nguoiphancong: { type: integer, nullable: true }
 *               ngayphancong: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/phancongca/{id}:
 *   put:
 *     summary: "Cập nhật phân công ca (VD: trạng thái, ghi chú)"
 *     tags: [Phân công ca]
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
 *               manhanvien: { type: integer }
 *               maca: { type: integer }
 *               ngaylamviec: { type: string, format: date }
 *               trangthai: { type: string }
 *               ghichu: { type: string }
 *               nguoiphancong: { type: integer }
 *               ngayphancong: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/phancongca/{id}:
 *   delete:
 *     summary: Xoá phân công ca
 *     tags: [Phân công ca]
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