const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thethanhvien.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Thẻ thành viên
 *     description: Quản lý thẻ thành viên của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/thethanhvien:
 *   get:
 *     summary: Lấy danh sách tất cả thẻ thành viên
 *     tags: [Thẻ thành viên]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/thethanhvien/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết thẻ thành viên
 *     tags: [Thẻ thành viên]
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
 * /api/thethanhvien/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy danh sách thẻ thành viên của khách hàng
 *     tags: [Thẻ thành viên]
 *     parameters:
 *       - in: path
 *         name: makhachhang
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/khachhang/:makhachhang', ctrl.getByKhachHang);

/**
 * @swagger
 * /api/thethanhvien:
 *   post:
 *     summary: Tạo thẻ thành viên mới
 *     tags: [Thẻ thành viên]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, mahangthe]
 *             properties:
 *               makhachhang: { type: integer }
 *               mahangthe: { type: integer }
 *               ngaycap: { type: string, format: date-time }
 *               ngayhethan: { type: string, format: date-time }
 *               trangthai: { type: boolean }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/thethanhvien/{id}:
 *   put:
 *     summary: Cập nhật thông tin thẻ thành viên
 *     tags: [Thẻ thành viên]
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
 *               mahangthe: { type: integer }
 *               ngayhethan: { type: string, format: date-time }
 *               trangthai: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/thethanhvien/{id}:
 *   delete:
 *     summary: Xoá thẻ thành viên
 *     tags: [Thẻ thành viên]
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
