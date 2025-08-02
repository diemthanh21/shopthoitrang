const express = require('express');
const router = express.Router();
const controller = require('../controllers/danhgia.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: DanhGia
 *     description: Quản lý đánh giá sản phẩm
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/danhgia:
 *   get:
 *     summary: Lấy tất cả đánh giá
 *     tags: [DanhGia]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   get:
 *     summary: Lấy theo mã đánh giá
 *     tags: [DanhGia]
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/danhgia/sanpham/{maSP}:
 *   get:
 *     summary: Tìm đánh giá theo mã sản phẩm
 *     tags: [DanhGia]
 */
router.get('/sanpham/:maSP', controller.findBySanPham);

/**
 * @swagger
 * /api/danhgia/khachhang/{maKH}:
 *   get:
 *     summary: Tìm đánh giá theo khách hàng
 *     tags: [DanhGia]
 */
router.get('/khachhang/:maKH', controller.findByKhachHang);

/**
 * @swagger
 * /api/danhgia/chitietdonhang/{maCTDH}:
 *   get:
 *     summary: Tìm đánh giá theo mã chi tiết đơn hàng
 *     tags: [DanhGia]
 */
router.get('/chitietdonhang/:maCTDH', controller.findByChiTietDonHang);

/**
 * @swagger
 * /api/danhgia:
 *   post:
 *     summary: Tạo đánh giá mới
 *     tags: [DanhGia]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [DanhGia]
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/danhgia/{id}:
 *   delete:
 *     summary: Xoá đánh giá
 *     tags: [DanhGia]
 */
router.delete('/:id', controller.delete);

module.exports = router;
