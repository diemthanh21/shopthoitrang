const express = require('express');
const router = express.Router();
const controller = require('../controllers/chucnang.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Chức năng
 *     description: Quản lý chức năng hệ thống
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChucNang:
 *       type: object
 *       properties:
 *         machucnang:
 *           type: integer
 *           example: 1
 *         tenchucnang:
 *           type: string
 *           example: Quản lý đơn hàng
 *         maquyen:
 *           type: string
 *           example: ADMIN
 *     NewChucNang:
 *       type: object
 *       required:
 *         - tenchucnang
 *         - maquyen
 *       properties:
 *         tenchucnang:
 *           type: string
 *           example: Quản lý kho
 *         maquyen:
 *           type: string
 *           example: USER
 *     UpdateChucNang:
 *       type: object
 *       properties:
 *         tenchucnang:
 *           type: string
 *           example: Quản lý kho (cập nhật)
 *         maquyen:
 *           type: string
 *           example: ADMIN
 */

router.use(authenticateToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
