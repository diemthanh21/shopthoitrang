const express = require('express');
const router = express.Router();
const controller = require('../controllers/sanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Sản phẩm
 *     description: Quản lý sản phẩm trong hệ thống
 */

// 🔐 Áp dụng middleware cho toàn bộ route
router.use(authenticateToken);

/**
 * @swagger
 * /api/sanpham/danhmuc/{maDanhMuc}:
 *   get:
 *     summary: Tìm sản phẩm theo mã danh mục
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maDanhMuc
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm theo danh mục
 */
router.get('/danhmuc/:maDanhMuc', controller.findByDanhMuc);

/**
 * @swagger
 * /api/sanpham/thuonghieu/{maThuongHieu}:
 *   get:
 *     summary: Tìm sản phẩm theo mã thương hiệu
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maThuongHieu
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm theo thương hiệu
 */
router.get('/thuonghieu/:maThuongHieu', controller.findByThuongHieu);

/**
 * @swagger
 * /api/sanpham/trangthai/{trangThai}:
 *   get:
 *     summary: Tìm sản phẩm theo trạng thái
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: trangThai
 *         required: true
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm theo trạng thái
 */
router.get('/trangthai/:trangThai', controller.findByTrangThai);

/**
 * @swagger
 * /api/sanpham:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm
 *     tags: [Sản phẩm]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/sanpham/{maSanPham}:
 *   get:
 *     summary: Lấy thông tin sản phẩm theo mã
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maSanPham
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maSanPham', controller.getById);

/**
 * @swagger
 * /api/sanpham:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MASANPHAM
 *               - TENSANPHAM
 *               - MADANHMUC
 *               - MATHUONGHIEU
 *             properties:
 *               MASANPHAM:
 *                 type: string
 *               TENSANPHAM:
 *                 type: string
 *               MADANHMUC:
 *                 type: string
 *               MATHUONGHIEU:
 *                 type: string
 *               TRANGTHAI:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thất bại
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/sanpham/{maSanPham}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maSanPham
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               TENSANPHAM:
 *                 type: string
 *               MADANHMUC:
 *                 type: string
 *               MATHUONGHIEU:
 *                 type: string
 *               TRANGTHAI:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Không thể cập nhật
 */
router.put('/:maSanPham', controller.update);

/**
 * @swagger
 * /api/sanpham/{maSanPham}:
 *   delete:
 *     summary: Xoá sản phẩm theo mã
 *     tags: [Sản phẩm]
 *     parameters:
 *       - in: path
 *         name: maSanPham
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Không thể xoá
 */
router.delete('/:maSanPham', controller.delete);

module.exports = router;
