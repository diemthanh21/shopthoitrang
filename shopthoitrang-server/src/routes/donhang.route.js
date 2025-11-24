const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donhang.controller');
const service = require('../services/donhang.service');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Đơn hàng
 *     description: Quản lý đơn hàng của khách hàng
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/donhang:
 *   get:
 *     summary: Lấy danh sách tất cả đơn hàng
 *     tags: [Đơn hàng]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/donhang/{id}:
 *   get:
 *     summary: Lấy đơn hàng theo ID
 *     tags: [Đơn hàng]
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

// Lightweight status endpoint for polling minimal order fields
router.get('/:id/status', async (req, res) => {
	try {
		const id = req.params.id;
		const service = require('../services/donhang.service');
		// Use service.get to leverage enrichment only if needed, then pick fields
		const data = await service.get(id);
		res.json({
			madonhang: data.madonhang || data.id || id,
			phuongthucthanhtoan: data.phuongthucthanhtoan || null,
			trangthaithanhtoan: data.trangthaithanhtoan || null,
			trangthaidonhang: data.trangthaidonhang || null,
		});
	} catch (err) {
		res.status(err.status || 404).json({ message: err.message || 'Not found' });
	}
});

/**
 * @swagger
 * /api/donhang/khachhang/{makhachhang}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo khách hàng
 *     tags: [Đơn hàng]
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
 * /api/donhang:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Đơn hàng]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makhachhang, phuongthucthanhtoan]
 *             properties:
 *               makhachhang: { type: integer }
 *               manhanvien: { type: integer, description: "Mã nhân viên xử lý đơn hàng (tùy chọn)" }
 *               thanhtien: { type: number }
 *               phuongthucthanhtoan: { type: string }
 *               trangthaithanhtoan: { type: string }
 *               trangthaidonhang: { type: string }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/donhang/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng
 *     tags: [Đơn hàng]
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
 *               manhanvien: { type: integer, description: "Mã nhân viên xử lý đơn hàng" }
 *               trangthaithanhtoan: { type: string }
 *               trangthaidonhang: { type: string }
 *               thanhtien: { type: number }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/donhang/{id}/phuongthucthanhtoan:
 *   patch:
 *     summary: Cập nhật riêng phương thức thanh toán của đơn hàng
 *     tags: [Đơn hàng]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: string, example: COD }
 *               phuongthucthanhtoan: { type: string, example: COD }
 *               method: { type: string, example: COD }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu dữ liệu
 */
router.patch('/:id/phuongthucthanhtoan', async (req, res) => {
	try {
		const id = req.params.id;
		const method = req.body?.value || req.body?.phuongthucthanhtoan || req.body?.method;
		if (!method) return res.status(400).json({ message: 'Missing payment method' });

		const updated = await service.update(id, { phuongthucthanhtoan: method });
		return res.json(updated.toJSON());
	} catch (err) {
		res.status(err.status || 400).json({ message: err.message || 'Update failed' });
	}
});

/**
 * @swagger
 * /api/donhang/{id}:
 *   delete:
 *     summary: Xoá đơn hàng
 *     tags: [Đơn hàng]
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