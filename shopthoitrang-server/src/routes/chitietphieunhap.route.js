const express = require('express');
const router = express.Router();
const controller = require('../controllers/chitietphieunhap.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết phiếu nhập
 *     description: Quản lý chi tiết phiếu nhập kho
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietphieunhap:
 *   get:
 *     summary: Lấy danh sách tất cả chi tiết phiếu nhập
 *     tags: [Chi tiết phiếu nhập]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chitietphieunhap/{maChiTietNhap}:
 *   get:
 *     summary: Lấy chi tiết theo mã
 *     tags: [Chi tiết phiếu nhập]
 */
router.get('/:maChiTietNhap', controller.getById);

/**
 * @swagger
 * /api/chitietphieunhap/phieunhap/{maPhieuNhap}:
 *   get:
 *     summary: Lấy danh sách theo mã phiếu nhập
 *     tags: [Chi tiết phiếu nhập]
 */
router.get('/phieunhap/:maPhieuNhap', controller.findByPhieuNhap);

/**
 * @swagger
 * /api/chitietphieunhap/chitietsanpham/{maChiTietSanPham}:
 *   get:
 *     summary: Lấy danh sách theo mã chi tiết sản phẩm
 *     tags: [Chi tiết phiếu nhập]
 */
router.get('/chitietsanpham/:maChiTietSanPham', controller.findByChiTietSanPham);

/**
 * @swagger
 * /api/chitietphieunhap:
 *   post:
 *     summary: Tạo mới
 *     tags: [Chi tiết phiếu nhập]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chitietphieunhap/{maChiTietNhap}:
 *   put:
 *     summary: Cập nhật
 *     tags: [Chi tiết phiếu nhập]
 */
router.put('/:maChiTietNhap', controller.update);

/**
 * @swagger
 * /api/chitietphieunhap/{maChiTietNhap}:
 *   delete:
 *     summary: Xoá
 *     tags: [Chi tiết phiếu nhập]
 */
router.delete('/:maChiTietNhap', controller.delete);

module.exports = router;
