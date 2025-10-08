const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/diachikhachhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Địa chỉ khách hàng
 *     description: Quản lý địa chỉ của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/diachikhachhang:
 *   get:
 *     summary: Lấy danh sách tất cả địa chỉ khách hàng
 *     tags: [Địa chỉ khách hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   get:
 *     summary: Lấy địa chỉ theo ID
 *     tags: [Địa chỉ khách hàng]
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
 * /api/diachikhachhang/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy danh sách địa chỉ theo khách hàng
 *     tags: [Địa chỉ khách hàng]
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
 * /api/diachikhachhang:
 *   post:
 *     summary: Thêm địa chỉ mới
 *     tags: [Địa chỉ khách hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, diachi]
 *             properties:
 *               makhachhang: { type: integer }
 *               diachi: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Địa chỉ khách hàng]
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
 *               diachi: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   delete:
 *     summary: Xoá địa chỉ khách hàng
 *     tags: [Địa chỉ khách hàng]
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
