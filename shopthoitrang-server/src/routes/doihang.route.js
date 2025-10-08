const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/doihang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Đổi hàng
 *     description: Quản lý yêu cầu đổi hàng của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/doihang:
 *   get:
 *     summary: Lấy danh sách tất cả yêu cầu đổi hàng
 *     tags: [Đổi hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/doihang/{id}:
 *   get:
 *     summary: Lấy yêu cầu đổi hàng theo ID
 *     tags: [Đổi hàng]
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
 * /api/doihang/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy danh sách đổi hàng theo khách hàng
 *     tags: [Đổi hàng]
 *     parameters:
 *       - in: path
 *         name: makhachhang
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/khachhang/:makhachhang', ctrl.getByCustomer);

/**
 * @swagger
 * /api/doihang:
 *   post:
 *     summary: Tạo yêu cầu đổi hàng mới
 *     tags: [Đổi hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [madonhang, makhachhang, machitietsanphamcu, machitietsanphamoi, soluong, lydo, trangthai]
 *             properties:
 *               madonhang: { type: integer }
 *               makhachhang: { type: integer }
 *               machitietsanphamcu: { type: integer }
 *               machitietsanphamoi: { type: integer }
 *               soluong: { type: integer }
 *               lydo: { type: string }
 *               trangthai: { type: string }
 *               ghichu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/doihang/{id}:
 *   put:
 *     summary: Cập nhật yêu cầu đổi hàng
 *     tags: [Đổi hàng]
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
 *               trangthai: { type: string }
 *               ghichu: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/doihang/{id}:
 *   delete:
 *     summary: Xoá yêu cầu đổi hàng
 *     tags: [Đổi hàng]
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
