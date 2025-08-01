// controllers/taikhoannhanvien.controller.js
const taiKhoanNhanVienService = require('../services/taikhoannhanvien.service');
const { generateToken } = require('../utils/jwt');

const TaiKhoanNhanVienController = {
  async dangNhap(req, res) {
    try {
      const { tenDangNhap, matKhau } = req.body;

      if (!tenDangNhap || !matKhau) {
        return res.status(400).json({ message: 'Thiếu thông tin đăng nhập.' });
      }

      const taiKhoan = await taiKhoanNhanVienService.dangNhap(tenDangNhap, matKhau);
      if (!taiKhoan) {
        return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
      }

      const payload = {
        maNhanVien: taiKhoan.maNhanVien,
        tenDangNhap: taiKhoan.tenDangNhap,
      };

      const token = generateToken(payload);

      return res.json({
        message: 'Đăng nhập thành công',
        token,
        user: taiKhoan.toJSON()
      });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  }
};

module.exports = TaiKhoanNhanVienController;
