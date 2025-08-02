const express = require('express');
const router = express.Router();
const controller = require('../controllers/khuyenmai.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Khuyến mãi
 *     description: Quản lý chương trình khuyến mãi
 */

/**
 * @swagger
 * /api/khuyenmai:
 *   get:
 *     summary: Lấy tất cả chương trình khuyến mãi
 *     tags: [Khuyến mãi]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/khuyenmai/{maKhuyenMai}:
 *   get:
 *     summary: Lấy thông tin khuyến mãi theo mã
 *     tags: [Khuyến mãi]
 *     parameters:
 *       - in: path
 *         name: maKhuyenMai
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maKhuyenMai', controller.getById);

/**
 * @swagger
 * /api/khuyenmai/sanpham/{maSanPham}:
 *   get:
 *     summary: Lấy khuyến mãi theo mã sản phẩm
 *     tags: [Khuyến mãi]
 *     parameters:
 *       - in: path
 *         name: maSanPham
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/sanpham/:maSanPham', controller.getByMaSanPham);

/**
 * @swagger
 * /api/khuyenmai:
 *   post:
 *     summary: Thêm chương trình khuyến mãi
 *     tags: [Khuyến mãi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenChuongTrinh
 *               - loaiKhuyenMai
 *             properties:
 *               tenChuongTrinh:
 *                 type: string
 *               loaiKhuyenMai:
 *                 type: string
 *               maSanPham:
 *                 type: string
 *               tyLeGiam:
 *                 type: number
 *               maSanPhamTang:
 *                 type: string
 *               ngayBatDau:
 *                 type: string
 *                 format: date
 *               ngayKetThuc:
 *                 type: string
 *                 format: date
 *               moTa:
 *                 type: string
 *               maNhanVien:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi tạo khuyến mãi
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/khuyenmai/{maKhuyenMai}:
 *   put:
 *     summary: Cập nhật thông tin khuyến mãi
 *     tags: [Khuyến mãi]
 *     parameters:
 *       - in: path
 *         name: maKhuyenMai
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenChuongTrinh:
 *                 type: string
 *               loaiKhuyenMai:
 *                 type: string
 *               tyLeGiam:
 *                 type: number
 *               ngayKetThuc:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thất bại
 */
router.put('/:maKhuyenMai', controller.update);

/**
 * @swagger
 * /api/khuyenmai/{maKhuyenMai}:
 *   delete:
 *     summary: Xoá chương trình khuyến mãi
 *     tags: [Khuyến mãi]
 *     parameters:
 *       - in: path
 *         name: maKhuyenMai
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Xoá thất bại
 */
router.delete('/:maKhuyenMai', controller.delete);

module.exports = router;
