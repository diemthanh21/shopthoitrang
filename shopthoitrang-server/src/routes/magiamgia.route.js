// src/routes/magiamgia.route.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/magiamgia.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Mã giảm giá
 *     description: Quản lý voucher và mã giảm giá
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/magiamgia:
 *   get:
 *     summary: Lấy danh sách mã giảm giá
 *     tags: [Mã giảm giá]
 *     parameters:
 *       - in: query
 *         name: macode
 *         schema: { type: string }
 *         description: Tìm kiếm theo mã
 *       - in: query
 *         name: maloaivoucher
 *         schema: { type: integer }
 *         description: Lọc theo loại voucher (nếu dùng bảng loaivoucher)
 *       - in: query
 *         name: hinhthuc_giam
 *         schema:
 *           type: string
 *           enum: [AMOUNT, PERCENT, FREESHIP]
 *         description: Lọc theo kiểu giảm giá
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Lọc theo trạng thái còn hiệu lực (ngày bắt đầu/kết thúc)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   get:
 *     summary: Lấy thông tin mã giảm giá theo ID
 *     tags: [Mã giảm giá]
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
 * /api/magiamgia:
 *   post:
 *     summary: Tạo mã giảm giá mới
 *     tags: [Mã giảm giá]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [macode, soluong, ngaybatdau, ngayketthuc, manhanvien]
 *             properties:
 *               macode: { type: string }
 *               mota: { type: string }
 *               maloaivoucher:
 *                 type: integer
 *                 nullable: true
 *                 description: Khóa ngoại sang bảng loaivoucher (nếu có)
 *               hinhthuc_giam:
 *                 type: string
 *                 enum: [AMOUNT, PERCENT, FREESHIP]
 *                 description: Kiểu giảm giá, mặc định AMOUNT
 *               giatrigiam:
 *                 type: number
 *                 nullable: true
 *                 description: Alias cũ cho sotien_giam (giảm tiền cố định)
 *               sotien_giam:
 *                 type: number
 *                 nullable: true
 *                 description: Số tiền giảm (khi hinhthuc_giam = AMOUNT)
 *               phantram_giam:
 *                 type: number
 *                 nullable: true
 *                 description: Phần trăm giảm (khi hinhthuc_giam = PERCENT)
 *               giam_toi_da:
 *                 type: number
 *                 nullable: true
 *                 description: Số tiền giảm tối đa (PERCENT / FREESHIP)
 *               dieukien_don_toi_thieu:
 *                 type: number
 *                 nullable: true
 *                 description: Giá trị đơn tối thiểu để được áp dụng
 *               chi_ap_dung_sinhnhat:
 *                 type: boolean
 *                 nullable: true
 *                 description: Voucher chỉ áp dụng trong dịp sinh nhật
 *               soluong: { type: integer, example: 50 }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               manhanvien: { type: integer }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   put:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Mã giảm giá]
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
 *               macode: { type: string }
 *               mota: { type: string }
 *               maloaivoucher: { type: integer, nullable: true }
 *               hinhthuc_giam:
 *                 type: string
 *                 enum: [AMOUNT, PERCENT, FREESHIP]
 *               giatrigiam: { type: number, nullable: true }
 *               sotien_giam: { type: number, nullable: true }
 *               phantram_giam: { type: number, nullable: true }
 *               giam_toi_da: { type: number, nullable: true }
 *               dieukien_don_toi_thieu: { type: number, nullable: true }
 *               chi_ap_dung_sinhnhat: { type: boolean, nullable: true }
 *               soluong: { type: integer }
 *               soluong_da_dung: { type: integer }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               manhanvien: { type: integer }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/magiamgia/{id}:
 *   delete:
 *     summary: Xoá mã giảm giá
 *     tags: [Mã giảm giá]
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
