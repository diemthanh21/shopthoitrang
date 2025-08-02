const express = require('express');
const router = express.Router();
const controller = require('../controllers/diachikhachhang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: DiaChiKhachHang
 *     description: Quản lý địa chỉ khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/diachikhachhang:
 *   get:
 *     summary: Lấy danh sách địa chỉ khách hàng
 *     tags: [DiaChiKhachHang]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   get:
 *     summary: Lấy địa chỉ theo ID
 *     tags: [DiaChiKhachHang]
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/diachikhachhang/khachhang/{maKH}:
 *   get:
 *     summary: Lấy địa chỉ theo mã khách hàng
 *     tags: [DiaChiKhachHang]
 */
router.get('/khachhang/:maKH', controller.findByKhachHang);

/**
 * @swagger
 * /api/diachikhachhang:
 *   post:
 *     summary: Tạo mới địa chỉ khách hàng
 *     tags: [DiaChiKhachHang]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ khách hàng
 *     tags: [DiaChiKhachHang]
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/diachikhachhang/{id}:
 *   delete:
 *     summary: Xoá địa chỉ khách hàng
 *     tags: [DiaChiKhachHang]
 */
router.delete('/:id', controller.delete);

module.exports = router;
