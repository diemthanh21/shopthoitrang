const express = require('express');
const router = express.Router();
const controller = require('../controllers/phieunhapkho.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phiếu nhập kho
 *     description: Quản lý phiếu nhập kho
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/phieunhapkho:
 *   get:
 *     summary: Lấy tất cả phiếu nhập
 *     tags: [Phiếu nhập kho]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/phieunhapkho/{maPhieuNhap}:
 *   get:
 *     summary: Lấy phiếu nhập theo mã
 *     tags: [Phiếu nhập kho]
 *     parameters:
 *       - in: path
 *         name: maPhieuNhap
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
router.get('/:maPhieuNhap', controller.getById);

/**
 * @swagger
 * /api/phieunhapkho/nhanvien/{maNhanVien}:
 *   get:
 *     summary: Tìm theo mã nhân viên
 *     tags: [Phiếu nhập kho]
 */
router.get('/nhanvien/:maNhanVien', controller.findByNhanVien);

/**
 * @swagger
 * /api/phieunhapkho/nhacungcap/{maNhaCungCap}:
 *   get:
 *     summary: Tìm theo mã nhà cung cấp
 *     tags: [Phiếu nhập kho]
 */
router.get('/nhacungcap/:maNhaCungCap', controller.findByNhaCungCap);

/**
 * @swagger
 * /api/phieunhapkho/ngay/{ngayNhap}:
 *   get:
 *     summary: Tìm theo ngày nhập (YYYY-MM-DD)
 *     tags: [Phiếu nhập kho]
 */
router.get('/ngay/:ngayNhap', controller.findByNgayNhap);

/**
 * @swagger
 * /api/phieunhapkho:
 *   post:
 *     summary: Thêm phiếu nhập mới
 *     tags: [Phiếu nhập kho]
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/phieunhapkho/{maPhieuNhap}:
 *   put:
 *     summary: Cập nhật phiếu nhập
 *     tags: [Phiếu nhập kho]
 */
router.put('/:maPhieuNhap', controller.update);

/**
 * @swagger
 * /api/phieunhapkho/{maPhieuNhap}:
 *   delete:
 *     summary: Xoá phiếu nhập
 *     tags: [Phiếu nhập kho]
 */
router.delete('/:maPhieuNhap', controller.delete);

module.exports = router;
