const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Xác thực và quản lý tài khoản
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginCustomerRequest:
 *       type: object
 *       required: [email, matkhau]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: customer@example.com
 *         matkhau:
 *           type: string
 *           format: password
 *           example: password123
 *     LoginEmployeeRequest:
 *       type: object
 *       required: [tendangnhap, matkhau]
 *       properties:
 *         tendangnhap:
 *           type: string
 *           example: nhanvien01
 *         matkhau:
 *           type: string
 *           format: password
 *           example: password123
 *     RegisterCustomerRequest:
 *       type: object
 *       required: [email, matkhau, hoten]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: newcustomer@example.com
 *         matkhau:
 *           type: string
 *           format: password
 *           example: password123
 *         hoten:
 *           type: string
 *           example: Nguyễn Văn A
 *         sodienthoai:
 *           type: string
 *           example: "0123456789"
 *     ChangePasswordRequest:
 *       type: object
 *       required: [matkhaucu, matkhaumoi]
 *       properties:
 *         matkhaucu:
 *           type: string
 *           format: password
 *           example: oldpassword123
 *         matkhaumoi:
 *           type: string
 *           format: password
 *           example: newpassword123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *             token:
 *               type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/auth/register/customer:
 *   post:
 *     summary: Đăng ký tài khoản khách hàng mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCustomerRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 */
router.post('/register/customer', ctrl.registerCustomer);

/**
 * @swagger
 * /api/auth/login/customer:
 *   post:
 *     summary: Đăng nhập cho khách hàng
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCustomerRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
router.post('/login/customer', ctrl.loginCustomer);

/**
 * @swagger
 * /api/auth/login/employee:
 *   post:
 *     summary: Đăng nhập cho nhân viên
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginEmployeeRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Tên đăng nhập hoặc mật khẩu không đúng
 */
router.post('/login/employee', ctrl.loginEmployee);

// Các route bên dưới yêu cầu authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.get('/me', ctrl.getCurrentUser);

/**
 * @swagger
 * /api/auth/change-password/customer:
 *   put:
 *     summary: Đổi mật khẩu cho khách hàng
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mật khẩu cũ không đúng
 *       401:
 *         description: Chưa đăng nhập
 */
router.put('/change-password/customer', ctrl.changeCustomerPassword);

/**
 * @swagger
 * /api/auth/change-password/employee:
 *   put:
 *     summary: Đổi mật khẩu cho nhân viên
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mật khẩu cũ không đúng
 *       401:
 *         description: Chưa đăng nhập
 */
router.put('/change-password/employee', ctrl.changeEmployeePassword);

module.exports = router;
