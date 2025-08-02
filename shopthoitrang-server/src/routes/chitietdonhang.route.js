const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietdonhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: ChiTietDonHang
 *     description: Quản lý chi tiết đơn hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietdonhang:
 *   get:
 *     summary: Lấy tất cả chi tiết đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   get:
 *     summary: Lấy theo mã chi tiết đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chitietdonhang/donhang/{maDonHang}:
 *   get:
 *     summary: Tìm theo mã đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.get('/donhang/:maDonHang', controller.findByDonHang);

/**
 * @swagger
 * /api/chitietdonhang/chitietsanpham/{maCTSP}:
 *   get:
 *     summary: Tìm theo mã chi tiết sản phẩm
 *     tags: [ChiTietDonHang]
 */
router.get('/chitietsanpham/:maCTSP', controller.findByChiTietSanPham);

/**
 * @swagger
 * /api/chitietdonhang:
 *   post:
 *     summary: Tạo mới chi tiết đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   put:
 *     summary: Cập nhật chi tiết đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chitietdonhang/{id}:
 *   delete:
 *     summary: Xoá chi tiết đơn hàng
 *     tags: [ChiTietDonHang]
 */
router.delete('/:id', controller.delete);

module.exports = router;
