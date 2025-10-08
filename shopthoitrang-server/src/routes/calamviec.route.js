const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/calamviec.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Ca làm việc
 *     description: Quản lý ca làm việc
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CaLamViec:
 *       type: object
 *       properties:
 *         maca:
 *           type: integer
 *           example: 1
 *         tenca:
 *           type: string
 *           example: Ca sáng
 *         giobatdau:
 *           type: string
 *           example: "08:00:00"
 *         gioketthuc:
 *           type: string
 *           example: "12:00:00"
 *         mota:
 *           type: string
 *           example: Phụ trách bán hàng sáng
 *     NewCaLamViec:
 *       type: object
 *       required: [tenca, giobatdau, gioketthuc]
 *       properties:
 *         tenca:       { type: string }
 *         giobatdau:   { type: string, example: "08:00" }
 *         gioketthuc:  { type: string, example: "12:00" }
 *         mota:        { type: string }
 *     UpdateCaLamViec:
 *       type: object
 *       properties:
 *         tenca:       { type: string }
 *         giobatdau:   { type: string }
 *         gioketthuc:  { type: string }
 *         mota:        { type: string }
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/calamviec:
 *   get:
 *     summary: Danh sách ca làm việc (tìm kiếm & phân trang)
 *     tags: [Ca làm việc]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, default: maca }
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
 *                   items: { $ref: '#/components/schemas/CaLamViec' }
 *                 total:
 *                   type: integer
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/calamviec/{id}:
 *   get:
 *     summary: Lấy ca làm việc theo ID
 *     tags: [Ca làm việc]
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
 *             schema: { $ref: '#/components/schemas/CaLamViec' }
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/calamviec:
 *   post:
 *     summary: Tạo ca làm việc mới
 *     tags: [Ca làm việc]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NewCaLamViec' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CaLamViec' }
 *       400:
 *         description: Bad request
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/calamviec/{id}:
 *   put:
 *     summary: Cập nhật ca làm việc
 *     tags: [Ca làm việc]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCaLamViec' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CaLamViec' }
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/calamviec/{id}:
 *   delete:
 *     summary: Xoá ca làm việc
 *     tags: [Ca làm việc]
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

module.exports = router;