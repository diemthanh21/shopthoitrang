const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/khuyenmai.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Khuyến mãi
 *     description: Quản lý chương trình khuyến mãi
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/khuyenmai:
 *   get:
 *     summary: Lấy danh sách khuyến mãi
 *     tags: [Khuyến mãi]
 *     parameters:
 *       - in: query
 *         name: masanpham
 *         schema: { type: integer }
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: [ "true", "false" ] }
 *         description: Lọc theo trạng thái còn hiệu lực (theo ngày)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   get:
 *     summary: Lấy chi tiết khuyến mãi theo ID
 *     tags: [Khuyến mãi]
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
 * /api/khuyenmai:
 *   post:
 *     summary: Tạo khuyến mãi mới
 *     tags: [Khuyến mãi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenchuongtrinh, loaikhuyenmai, ngaybatdau, ngayketthuc, manhanvien]
 *             properties:
 *               tenchuongtrinh: { type: string }
 *               loaikhuyenmai: { type: string, example: "PERCENT" }
 *               masanpham: { type: integer, nullable: true }
 *               tylegiam: { type: number, example: 10, description: "Phần trăm giảm (0,100]" }
 *               masanphamtang: { type: integer, nullable: true }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               mota: { type: string }
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
 * /api/khuyenmai/{id}:
 *   put:
 *     summary: Cập nhật khuyến mãi
 *     tags: [Khuyến mãi]
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
 *               tenchuongtrinh: { type: string }
 *               loaikhuyenmai: { type: string }
 *               masanpham: { type: integer, nullable: true }
 *               tylegiam: { type: number }
 *               masanphamtang: { type: integer, nullable: true }
 *               ngaybatdau: { type: string, format: date }
 *               ngayketthuc: { type: string, format: date }
 *               mota: { type: string }
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
 * /api/khuyenmai/{id}:
 *   delete:
 *     summary: Xoá khuyến mãi
 *     tags: [Khuyến mãi]
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
