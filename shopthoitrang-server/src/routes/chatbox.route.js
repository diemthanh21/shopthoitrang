const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbox.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: ChatBox
 *     description: Quản lý hộp thoại trò chuyện
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chatbox:
 *   get:
 *     summary: Lấy danh sách tất cả chatbox
 *     tags: [ChatBox]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/chatbox/{id}:
 *   get:
 *     summary: Lấy chatbox theo mã
 *     tags: [ChatBox]
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/chatbox/khachhang/{maKhachHang}:
 *   get:
 *     summary: Tìm theo mã khách hàng
 *     tags: [ChatBox]
 */
router.get('/khachhang/:maKhachHang', controller.findByKhachHang);

/**
 * @swagger
 * /api/chatbox/nhanvien/{maNhanVien}:
 *   get:
 *     summary: Tìm theo mã nhân viên
 *     tags: [ChatBox]
 */
router.get('/nhanvien/:maNhanVien', controller.findByNhanVien);

/**
 * @swagger
 * /api/chatbox:
 *   post:
 *     summary: Tạo mới chatbox
 *     tags: [ChatBox]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/chatbox/{id}:
 *   put:
 *     summary: Cập nhật chatbox
 *     tags: [ChatBox]
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/chatbox/{id}:
 *   delete:
 *     summary: Xoá chatbox
 *     tags: [ChatBox]
 */
router.delete('/:id', controller.delete);

module.exports = router;
