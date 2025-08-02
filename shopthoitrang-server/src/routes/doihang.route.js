const express = require('express');
const router = express.Router();
const controller = require('../controllers/doihang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: DoiHang
 *     description: Quản lý đổi hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/doihang:
 *   get:
 *     summary: Lấy tất cả đơn đổi hàng
 *     tags: [DoiHang]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/doihang/{id}:
 *   get:
 *     summary: Lấy đơn đổi hàng theo mã
 *     tags: [DoiHang]
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/doihang/donhang/{maDonHang}:
 *   get:
 *     summary: Tìm đổi hàng theo mã đơn hàng
 *     tags: [DoiHang]
 */
router.get('/donhang/:maDonHang', controller.findByDonHang);

/**
 * @swagger
 * /api/doihang/khachhang/{maKH}:
 *   get:
 *     summary: Tìm đổi hàng theo mã khách hàng
 *     tags: [DoiHang]
 */
router.get('/khachhang/:maKH', controller.findByKhachHang);

/**
 * @swagger
 * /api/doihang:
 *   post:
 *     summary: Tạo yêu cầu đổi hàng
 *     tags: [DoiHang]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/doihang/{id}:
 *   put:
 *     summary: Cập nhật thông tin đổi hàng
 *     tags: [DoiHang]
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/doihang/{id}:
 *   delete:
 *     summary: Xoá yêu cầu đổi hàng
 *     tags: [DoiHang]
 */
router.delete('/:id', controller.delete);

module.exports = router;
