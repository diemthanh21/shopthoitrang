const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chotca.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chốt ca
 *     description: Quản lý thông tin chốt ca làm việc của nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chotca:
 *   get:
 *     summary: Lấy danh sách tất cả chốt ca
 *     tags: [Chốt ca]
 *     parameters:
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *       - in: query
 *         name: ngaychotca
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: trangthai
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/chotca/{id}:
 *   get:
 *     summary: Lấy thông tin chốt ca theo ID
 *     tags: [Chốt ca]
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
 * /api/chotca:
 *   post:
 *     summary: Tạo mới chốt ca
 *     tags: [Chốt ca]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, ngaychotca]
 *             properties:
 *               manhanvien: { type: integer, description: "Mã nhân viên" }
 *               ngaychotca: { type: string, format: date, description: "Ngày chốt ca" }
 *               tongthu: { type: number, description: "Tổng thu" }
 *               tienmat: { type: number, description: "Tiền mặt" }
 *               tienchi: { type: number, description: "Tiền chi" }
 *               tienchuyenkhoan: { type: number, description: "Tiền chuyển khoản" }
 *               soluongdonhang: { type: integer, description: "Số lượng đơn hàng" }
 *               chenhlechtienmat: { type: number, description: "Chênh lệch tiền mặt" }
 *               ghichu: { type: string, description: "Ghi chú" }
 *               trangthai: { type: string, description: "Trạng thái" }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/chotca/{id}:
 *   put:
 *     summary: Cập nhật thông tin chốt ca
 *     tags: [Chốt ca]
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
 *               tongthu: { type: number, description: "Tổng thu" }
 *               tienmat: { type: number, description: "Tiền mặt" }
 *               tienchuyenkhoan: { type: number, description: "Tiền chuyển khoản" }
 *               soluongdonhang: { type: integer, description: "Số lượng đơn hàng" }
 *               chenhlechtienmat: { type: number, description: "Chênh lệch tiền mặt" }
 *               ghichu: { type: string, description: "Ghi chú" }
 *               nguoiduyet: { type: integer, description: "Mã người duyệt" }
 *               ngayduyet: { type: string, format: date-time, description: "Ngày duyệt" }
 *               trangthai: { type: string, description: "Trạng thái" }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/chotca/{id}:
 *   delete:
 *     summary: Xoá chốt ca
 *     tags: [Chốt ca]
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
