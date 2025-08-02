const express = require('express');
const router = express.Router();
const controller = require('../controllers/taikhoannhanvien.controller');

/**
 * @swagger
 * /api/taikhoannhanvien/login:
 *   post:
 *     summary: Đăng nhập tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenDangNhap:
 *                 type: string
 *               matKhau:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', controller.dangNhap);

/**
 * @swagger
 * /api/taikhoannhanvien:
 *   post:
 *     summary: Tạo mới tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               MANHANVIEN:
 *                 type: string
 *               TENDANGNHAP:
 *                 type: string
 *               MATKHAU:
 *                 type: string
 *               DANGHOATDONG:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', controller.taoMoi);

/**
 * @swagger
 * /api/taikhoannhanvien:
 *   get:
 *     summary: Lấy danh sách tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.layTatCa);

/**
 * @swagger
 * /api/taikhoannhanvien/{maNhanVien}:
 *   get:
 *     summary: Lấy thông tin tài khoản theo mã
 *     tags: [Tài khoản nhân viên]
 *     parameters:
 *       - in: path
 *         name: maNhanVien
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:maNhanVien', controller.layTheoMa);

/**
 * @swagger
 * /api/taikhoannhanvien/{maNhanVien}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản
 *     tags: [Tài khoản nhân viên]
 *     parameters:
 *       - in: path
 *         name: maNhanVien
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
 *               TENDANGNHAP:
 *                 type: string
 *               MATKHAU:
 *                 type: string
 *               DANGHOATDONG:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi cập nhật
 */
router.put('/:maNhanVien', controller.capNhat);

/**
 * @swagger
 * /api/taikhoannhanvien/{maNhanVien}:
 *   delete:
 *     summary: Xoá (mềm) tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
 *     parameters:
 *       - in: path
 *         name: maNhanVien
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Không thể xoá
 */
router.delete('/:maNhanVien', controller.xoa);

module.exports = router;
