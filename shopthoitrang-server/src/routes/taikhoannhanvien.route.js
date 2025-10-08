const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/taikhoannhanvien.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Tài khoản nhân viên
 *     description: Quản lý tài khoản đăng nhập của nhân viên
 */

router.use(authenticateToken);

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
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/taikhoannhanvien/{id}:
 *   get:
 *     summary: Lấy tài khoản nhân viên theo mã
 *     tags: [Tài khoản nhân viên]
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
 * /api/taikhoannhanvien:
 *   post:
 *     summary: Tạo tài khoản nhân viên mới
 *     tags: [Tài khoản nhân viên]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manhanvien, tendangnhap, matkhau]
 *             properties:
 *               manhanvien: { type: integer }
 *               tendangnhap: { type: string }
 *               matkhau: { type: string }
 *               danghoatdong: { type: boolean }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi hoặc trùng tên đăng nhập
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/taikhoannhanvien/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
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
 *               tendangnhap: { type: string }
 *               matkhau: { type: string }
 *               danghoatdong: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/taikhoannhanvien/{id}:
 *   delete:
 *     summary: Xoá tài khoản nhân viên
 *     tags: [Tài khoản nhân viên]
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
