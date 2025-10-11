const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nhanvien.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Nhân viên
 *     description: Quản lý thông tin nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/nhanvien:
 *   get:
 *     summary: Lấy danh sách nhân viên (hỗ trợ lọc)
 *     tags: [Nhân viên]
 *     parameters:
 *       - in: query
 *         name: machucnang
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Tìm theo tên/email/số điện thoại (ilike)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   get:
 *     summary: Lấy thông tin nhân viên theo ID
 *     tags: [Nhân viên]
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
 * /api/nhanvien:
 *   post:
 *     summary: Tạo nhân viên mới
 *     tags: [Nhân viên]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hoten, machucnang]
 *             properties:
 *               hoten: { type: string }
 *               gioitinh: { type: string, enum: ["Nam", "Nữ", "Khác"] }
 *               cccd: { type: string }
 *               ngaycap: { type: string, format: date-time }
 *               noicap: { type: string }
 *               ngaybatdau: { type: string, format: date-time }
 *               ngayhethan: { type: string, format: date-time }
 *               trangthai: { type: string }
 *               luong: { type: number }
 *               email: { type: string }
 *               sodienthoai: { type: string }
 *               ngaysinh: { type: string, format: date-time }
 *               diachi: { type: string }
 *               machucnang: { type: integer }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   put:
 *     summary: Cập nhật thông tin nhân viên
 *     tags: [Nhân viên]
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
 *               hoten: { type: string }
 *               gioitinh: { type: string, enum: ["Nam", "Nữ", "Khác"] }
 *               cccd: { type: string }
 *               ngaycap: { type: string, format: date-time }
 *               noicap: { type: string }
 *               ngaybatdau: { type: string, format: date-time }
 *               ngayhethan: { type: string, format: date-time }
 *               trangthai: { type: string }
 *               luong: { type: number }
 *               email: { type: string }
 *               sodienthoai: { type: string }
 *               ngaysinh: { type: string, format: date-time }
 *               diachi: { type: string }
 *               machucnang: { type: integer }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/nhanvien/{id}:
 *   delete:
 *     summary: Xoá nhân viên
 *     tags: [Nhân viên]
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
