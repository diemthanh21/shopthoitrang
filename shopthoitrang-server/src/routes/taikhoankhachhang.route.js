const express = require('express');
const router = express.Router();
const controller = require('../controllers/taikhoankhachhang.controller');

/**
 * @swagger
 * tags:
 *   - name: Tài khoản khách hàng
 *     description: Quản lý tài khoản khách hàng
 */

/**
 * @swagger
 * /api/taikhoankhachhang/login:
 *   post:
 *     summary: Đăng nhập tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenDangNhap:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *       401:
 *         description: Sai tên đăng nhập hoặc mật khẩu
 */
router.post('/login', controller.dangNhap);

/**
 * @swagger
 * /api/taikhoankhachhang:
 *   post:
 *     summary: Tạo tài khoản khách hàng mới
 *     tags: [Tài khoản khách hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MAKHACHHANG
 *               - TENDANGNHAP
 *               - PASS
 *             properties:
 *               MAKHACHHANG:
 *                 type: string
 *               HOTEN:
 *                 type: string
 *               TENDANGNHAP:
 *                 type: string
 *               EMAIL:
 *                 type: string
 *               PASS:
 *                 type: string
 *               SODIENTHOAI:
 *                 type: string
 *               DANGHOATDONG:
 *                 type: boolean
 *               ANHDAIDIEN:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Không thể tạo tài khoản
 */
router.post('/', controller.taoMoi);

/**
 * @swagger
 * /api/taikhoankhachhang:
 *   get:
 *     summary: Lấy danh sách tất cả tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.layTatCa);

/**
 * @swagger
 * /api/taikhoankhachhang/{maKhachHang}:
 *   get:
 *     summary: Lấy thông tin tài khoản khách hàng theo mã
 *     tags: [Tài khoản khách hàng]
 *     parameters:
 *       - in: path
 *         name: maKhachHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get('/:maKhachHang', controller.layTheoMa);

/**
 * @swagger
 * /api/taikhoankhachhang/{maKhachHang}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
 *     parameters:
 *       - in: path
 *         name: maKhachHang
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
 *               HOTEN:
 *                 type: string
 *               EMAIL:
 *                 type: string
 *               PASS:
 *                 type: string
 *               SODIENTHOAI:
 *                 type: string
 *               DANGHOATDONG:
 *                 type: boolean
 *               ANHDAIDIEN:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Không thể cập nhật
 */
router.put('/:maKhachHang', controller.capNhat);

/**
 * @swagger
 * /api/taikhoankhachhang/{maKhachHang}:
 *   delete:
 *     summary: Xoá (mềm) tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
 *     parameters:
 *       - in: path
 *         name: maKhachHang
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xoá tài khoản
 *       400:
 *         description: Không thể xoá
 */
router.delete('/:maKhachHang', controller.xoa);

module.exports = router;
