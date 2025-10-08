const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/taikhoankhachhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Tài khoản khách hàng
 *     description: Quản lý tài khoản khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/taikhoankhachhang:
 *   get:
 *     summary: Lấy danh sách tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
 *     parameters:
 *       - in: query
 *         name: hoten
 *         schema: { type: string }
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: danghoatdong
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/taikhoankhachhang/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
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
 *             required: [hoten, tendangnhap, pass]
 *             properties:
 *               hoten: { type: string }
 *               tendangnhap: { type: string }
 *               pass: { type: string }
 *               email: { type: string }
 *               sodienthoai: { type: string }
 *               anhdaidien: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/taikhoankhachhang/{id}:
 *   put:
 *     summary: Cập nhật thông tin khách hàng
 *     tags: [Tài khoản khách hàng]
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
 *               hoten: { type: string }
 *               email: { type: string }
 *               sodienthoai: { type: string }
 *               anhdaidien: { type: string }
 *               pass: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/taikhoankhachhang/{id}:
 *   delete:
 *     summary: Xoá tài khoản khách hàng
 *     tags: [Tài khoản khách hàng]
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
