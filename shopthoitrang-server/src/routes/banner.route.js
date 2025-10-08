const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/banner.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const { requireEmployee } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   - name: Banner
 *     description: Quản lý banner hiển thị
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         mabanner: { type: integer, example: 1 }
 *         duongdananh: { type: string, example: "https://cdn.example.com/banners/sale-10-10.jpg" }
 *         mota: { type: string, example: "Siêu sale 10.10" }
 *         lienket: { type: string, example: "https://example.com/sale-10-10" }
 *         thutuhienthi: { type: integer, example: 1 }
 *         danghoatdong: { type: boolean, example: true }
 *     NewBanner:
 *       type: object
 *       required: [duongdananh]
 *       properties:
 *         duongdananh: { type: string }
 *         mota: { type: string }
 *         lienket: { type: string }
 *         thutuhienthi: { type: integer }
 *         danghoatdong: { type: boolean }
 */

// ========== PUBLIC ROUTES ==========

/**
 * @swagger
 * /api/banner:
 *   get:
 *     summary: Danh sách banner
 *     tags: [Banner]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/banner/{id}:
 *   get:
 *     summary: Lấy banner theo ID
 *     tags: [Banner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Found
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', ctrl.getById);

// ========== PROTECTED ROUTES ==========

/**
 * @swagger
 * /api/banner:
 *   post:
 *     summary: Tạo banner mới
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duongdananh]
 *             properties:
 *               duongdananh: { type: string }
 *               mota: { type: string }
 *               lienket: { type: string }
 *               thutuhienthi: { type: integer }
 *               danghoatdong: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post('/', authenticateToken, requireEmployee, ctrl.create);

/**
 * @swagger
 * /api/banner/{id}:
 *   put:
 *     summary: Cập nhật banner
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
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
 *               duongdananh: { type: string }
 *               mota: { type: string }
 *               lienket: { type: string }
 *               thutuhienthi: { type: integer }
 *               danghoatdong: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put('/:id', authenticateToken, requireEmployee, ctrl.update);

/**
 * @swagger
 * /api/banner/{id}:
 *   delete:
 *     summary: Xoá banner
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticateToken, requireEmployee, ctrl.delete);

module.exports = router;