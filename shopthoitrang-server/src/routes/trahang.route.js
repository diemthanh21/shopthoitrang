const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trahang.controller');
const logCtrl = require('../controllers/trahanglog.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Trả hàng
 *     description: Quản lý yêu cầu trả hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/trahang:
 *   get:
 *     summary: Lấy danh sách yêu cầu trả hàng (hỗ trợ lọc)
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: query
 *         name: makhachhang
 *         schema: { type: integer }
 *       - in: query
 *         name: madonhang
 *         schema: { type: integer }
 *       - in: query
 *         name: trangthai
 *         schema: { type: string, example: "CHỜ DUYỆT" }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/trahang/{id}:
 *   get:
 *     summary: Lấy chi tiết yêu cầu trả hàng theo ID
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/trahang:
 *   post:
 *     summary: Tạo yêu cầu trả hàng mới
 *     tags: [Trả hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [madonhang, makhachhang, machitietsanpham, soluong, lydo]
 *             properties:
 *               madonhang: { type: integer }
 *               makhachhang: { type: integer }
 *               machitietsanpham: { type: integer }
 *               soluong: { type: integer, minimum: 1 }
 *               lydo: { type: string }
 *               hinhanhloi: { type: string }
 *               ngayyeucau: { type: string, format: date-time }
 *               trangthai: { type: string, example: "CHỜ DUYỆT" }
 *               ghichu: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/trahang/{id}:
 *   put:
 *     summary: "Cập nhật yêu cầu trả hàng (VD: trạng thái, ghi chú)"
 *     tags: [Trả hàng]
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
 *               soluong: { type: integer, minimum: 1 }
 *               lydo: { type: string }
 *               hinhanhloi: { type: string }
 *               trangthai: { type: string, example: "ĐÃ CHẤP NHẬN" }
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
 * /api/trahang/{id}:
 *   delete:
 *     summary: Xoá yêu cầu trả hàng
 *     tags: [Trả hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Xoá thành công }
 *       404: { description: Không tìm thấy }
 */
router.delete('/:id', ctrl.delete);

// --- Workflow specific endpoints ---
router.post('/:id/accept', ctrl.accept);        // body: { diachiguihang }
router.post('/:id/reject', ctrl.reject);        // body: { lydo }
router.post('/:id/mark-received', ctrl.markReceived);
router.post('/:id/mark-invalid', ctrl.markInvalid); // body: { ghichu }
router.post('/:id/mark-valid', ctrl.markValid);
router.post('/:id/calc-refund', ctrl.calcRefund);
router.post('/:id/refund', ctrl.refund);        // body: { phuongthuc }
router.get('/:id/refund-preview', ctrl.refundPreview);
// Logs
router.get('/:id/logs', logCtrl.list);

module.exports = router;