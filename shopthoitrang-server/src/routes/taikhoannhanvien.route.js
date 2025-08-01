// routes/taikhoannhanvien.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/taikhoannhanvien.controller');

/**
 * @swagger
 * /api/taikhoannhanvien/login:
 *   post:
 *     summary: Đăng nhập tài khoản nhân viên
 *     tags:
 *       - Tài khoản nhân viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenDangNhap:
 *                 type: string
 *               matKhau:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', controller.dangNhap);

module.exports = router;
