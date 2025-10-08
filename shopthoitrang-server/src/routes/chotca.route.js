const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chotca.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chốt ca
 *     description: Quản lý thông tin chốt ca làm việc của nhân viên
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chotca:
 *   get:
 *     summary: Lấy danh sách tất cả chốt ca
 *     tags: [Chốt ca]
 *     parameters:
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *       - in: query
 *         name: maca
 *         schema: { type: integer }
 *       - in: query
 *         name: maphancong
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/chotca/{id}:
 *   get:
 *     summary: Lấy thông tin chốt ca theo ID
 *     tags: [Chốt ca]
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
 * /api/chotca:
 *   post:
 *     summary: Tạo mới chốt ca
 *     tags: [Chốt ca]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maphancong, manhanvien, maca]
 *             properties:
 *               maphancong: { type: integer }
 *               manhanvien: { type: integer }
 *               maca: { type: integer }
 *               ngaychotca: { type: string, format: date }
 *               tongthu: { type: number }
 *               tongchi: { type: number }
 *               tienmat: { type: number }
 *               tienchuyenkhoan: { type: number }
 *               soluongdonhang: { type: integer }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/chotca/{id}:
 *   put:
 *     summary: Cập nhật thông tin chốt ca
 *     tags: [Chốt ca]
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
 *               tongthu: { type: number }
 *               tongchi: { type: number }
 *               ghichu: { type: string }
 *               trangthai: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/chotca/{id}:
 *   delete:
 *     summary: Xoá chốt ca
 *     tags: [Chốt ca]
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
