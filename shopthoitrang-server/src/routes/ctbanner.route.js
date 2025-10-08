const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ctbanner.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết Banner
 *     description: Quản lý lịch sử thay đổi banner (nhân viên chỉnh sửa, thời gian tự động)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/ctbanner:
 *   get:
 *     summary: Lấy danh sách chi tiết banner
 *     tags: [Chi tiết Banner]
 *     parameters:
 *       - in: query
 *         name: mabanner
 *         schema: { type: integer }
 *       - in: query
 *         name: manhanvien
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/ctbanner/{mabanner}/{manhanvien}:
 *   get:
 *     summary: Lấy chi tiết banner theo mã banner và nhân viên
 *     tags: [Chi tiết Banner]
 *     parameters:
 *       - in: path
 *         name: mabanner
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: manhanvien
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:mabanner/:manhanvien', ctrl.getById);

/**
 * @swagger
 * /api/ctbanner:
 *   post:
 *     summary: "Tạo chi tiết banner mới (thoigiandoi tự động = giờ VN hiện tại)"
 *     tags: [Chi tiết Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mabanner, manhanvien]
 *             properties:
 *               mabanner: 
 *                 type: integer
 *                 example: 1
 *                 description: Mã banner
 *               manhanvien: 
 *                 type: integer
 *                 example: 2
 *                 description: Mã nhân viên
 *           example:
 *             mabanner: 1
 *             manhanvien: 2
 *     responses:
 *       201:
 *         description: "Tạo thành công (thoigiandoi được set tự động)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mabanner: { type: integer }
 *                 manhanvien: { type: integer }
 *                 thoigiandoi: { type: string, format: date-time, description: "Tự động = giờ VN hiện tại" }
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/ctbanner/{mabanner}/{manhanvien}:
 *   put:
 *     summary: "Cập nhật chi tiết banner (KHÔNG cho phép sửa thoigiandoi)"
 *     tags: [Chi tiết Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mabanner
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: manhanvien
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mabanner: 
 *                 type: integer
 *                 description: "Mã banner mới (nếu muốn đổi)"
 *               manhanvien: 
 *                 type: integer
 *                 description: "Mã nhân viên mới (nếu muốn đổi)"
 *             description: "Lưu ý: thoigiandoi KHÔNG được phép cập nhật"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:mabanner/:manhanvien', ctrl.update);

/**
 * @swagger
 * /api/ctbanner/{mabanner}/{manhanvien}:
 *   delete:
 *     summary: Xoá bản ghi chi tiết banner
 *     tags: [Chi tiết Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mabanner
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: manhanvien
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:mabanner/:manhanvien', ctrl.delete);

module.exports = router;