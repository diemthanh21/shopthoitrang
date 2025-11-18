const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chitietsanpham.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chi tiết sản phẩm
 *     description: Quản lý biến thể/thuộc tính sản phẩm (size, màu, chất liệu...)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChiTietSanPham:
 *       type: object
 *       properties:
 *         machitietsanpham: { type: integer, example: 101 }
 *         masanpham:        { type: integer, example: 20 }
 *         kichthuoc:        { type: string,  example: "M" }
 *         mausac:           { type: string,  example: "Đen" }
 *         chatlieu:         { type: string,  example: "Cotton" }
 *         mota:             { type: string,  example: "Form rộng, unisex" }
 *         giaban:           { type: number,  example: 199000 }
 *         soluongton:       { type: integer, example: 15 }
 *     NewChiTietSanPham:
 *       type: object
 *       required: [masanpham, giaban]
 *       properties:
 *         masanpham:  { type: integer }
 *         kichthuoc:  { type: string, maxLength: 10 }
 *         mausac:     { type: string, maxLength: 50 }
 *         chatlieu:   { type: string, maxLength: 50 }
 *         mota:       { type: string, maxLength: 100 }
 *         giaban:     { type: number }
 *         soluongton: { type: integer, default: 0 }
 *     UpdateChiTietSanPham:
 *       type: object
 *       properties:
 *         masanpham:  { type: integer }
 *         kichthuoc:  { type: string, maxLength: 10 }
 *         mausac:     { type: string, maxLength: 50 }
 *         chatlieu:   { type: string, maxLength: 50 }
 *         mota:       { type: string, maxLength: 100 }
 *         giaban:     { type: number }
 *         soluongton: { type: integer }
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/chitietsanpham:
 *   get:
 *     summary: Danh sách chi tiết sản phẩm (lọc & phân trang)
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: query
 *         name: masanpham
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Tìm theo kích thước/màu/chất liệu/mô tả" }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, default: machitietsanpham }
 *       - in: query
 *         name: orderDir
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ChiTietSanPham' }
 *                 total: { type: integer }
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ChiTietSanPham' }
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/chitietsanpham:
 *   post:
 *     summary: Tạo chi tiết sản phẩm mới
 *     tags: [Chi tiết sản phẩm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NewChiTietSanPham' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ChiTietSanPham' }
 *       400:
 *         description: Bad request
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   put:
 *     summary: Cập nhật chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateChiTietSanPham' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ChiTietSanPham' }
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/chitietsanpham/{id}:
 *   delete:
 *     summary: Xoá chi tiết sản phẩm
 *     tags: [Chi tiết sản phẩm]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Not found
 */
router.delete('/:id', ctrl.delete);

router.get('/:id/sizes', ctrl.getSizes);
router.post('/:id/sizes', ctrl.saveSizes);

module.exports = router;
