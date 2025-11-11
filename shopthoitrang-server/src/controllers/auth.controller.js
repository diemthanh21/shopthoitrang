const AuthService = require('../services/auth.service');

const AuthController = {
  /**
   * Đăng ký khách hàng mới
   */
  async registerCustomer(req, res) {
    try {
      const { email, matkhau, hoten, sodienthoai } = req.body;

      // Validate
      if (!email || !matkhau || !hoten) {
        return res.status(400).json({
          success: false,
          message: 'Email, mật khẩu và họ tên là bắt buộc'
        });
      }

      const result = await AuthService.registerCustomer({
        email,
        matkhau,
        hoten,
        sodienthoai
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: result
      });
    } catch (error) {
      console.error('Error in registerCustomer:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi đăng ký tài khoản'
      });
    }
  },

  /**
   * Đăng nhập khách hàng
   */
  async loginCustomer(req, res) {
    try {
      const { email, matkhau } = req.body;

      // Validate
      if (!email || !matkhau) {
        return res.status(400).json({
          success: false,
          message: 'Email và mật khẩu là bắt buộc'
        });
      }

      const result = await AuthService.loginCustomer(email, matkhau);

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error) {
      console.error('Error in loginCustomer:', error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Lỗi khi đăng nhập'
      });
    }
  },

  /**
   * Đăng nhập nhân viên
   */
  async loginEmployee(req, res) {
    try {
      const { tendangnhap, matkhau } = req.body;

      // Validate
      if (!tendangnhap || !matkhau) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập và mật khẩu là bắt buộc'
        });
      }

      const result = await AuthService.loginEmployee(tendangnhap, matkhau);

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error) {
      console.error('Error in loginEmployee:', error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Lỗi khi đăng nhập'
      });
    }
  },

  /**
   * Đổi mật khẩu khách hàng (yêu cầu đăng nhập)
   */
  async changeCustomerPassword(req, res) {
    try {
      const { matkhaucu, matkhaumoi } = req.body;
      const { makhachhang } = req.user; // Lấy từ JWT token

      // Validate
      if (!matkhaucu || !matkhaumoi) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc'
        });
      }

      if (matkhaumoi.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const result = await AuthService.changeCustomerPassword(
        makhachhang,
        matkhaucu,
        matkhaumoi
      );

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in changeCustomerPassword:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi đổi mật khẩu'
      });
    }
  },

  /**
   * Đổi mật khẩu nhân viên (yêu cầu đăng nhập)
   */
  async changeEmployeePassword(req, res) {
    try {
      const { matkhaucu, matkhaumoi } = req.body;
      const { manhanvien } = req.user; // Lấy từ JWT token

      // Validate
      if (!matkhaucu || !matkhaumoi) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc'
        });
      }

      if (matkhaumoi.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const result = await AuthService.changeEmployeePassword(
        manhanvien,
        matkhaucu,
        matkhaumoi
      );

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in changeEmployeePassword:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi đổi mật khẩu'
      });
    }
  },

  /**
   * Lấy thông tin user hiện tại (từ JWT token)
   */
  async getCurrentUser(req, res) {
    try {
      const user = req.user; // Lấy từ JWT token đã được verify

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return res.status(400).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng'
      });
    }
  }
};

module.exports = AuthController;
