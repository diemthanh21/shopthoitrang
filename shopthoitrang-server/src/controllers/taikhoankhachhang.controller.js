const taiKhoanKhachHangService = require('../services/taikhoankhachhang.service');
const { generateToken } = require('../utils/jwt');

const TaiKhoanKhachHangController = {
  async dangNhap(req, res) {
    try {
      const { tenDangNhap, pass } = req.body;

      if (!tenDangNhap || !pass) {
        return res.status(400).json({ message: 'Thiếu thông tin đăng nhập.' });
      }

      const taiKhoan = await taiKhoanKhachHangService.dangNhap(tenDangNhap, pass);
      if (!taiKhoan) {
        return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
      }

      const token = generateToken({
        maKhachHang: taiKhoan.maKhachHang,
        tenDangNhap: taiKhoan.tenDangNhap
      });

      return res.json({
        message: 'Đăng nhập thành công',
        token,
        user: taiKhoan.toJSON()
      });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  },

  async taoMoi(req, res) {
    try {
      const taiKhoanMoi = await taiKhoanKhachHangService.taoMoi(req.body);
      if (!taiKhoanMoi) {
        return res.status(400).json({ message: 'Tạo tài khoản không thành công.' });
      }
      return res.status(201).json({
        message: 'Tạo tài khoản thành công',
        user: taiKhoanMoi.toJSON()
      });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  },

  async layTatCa(req, res) {
    try {
      const danhSach = await taiKhoanKhachHangService.layTatCa();
      return res.json(danhSach.map(tk => tk.toJSON()));
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  },

  async layTheoMa(req, res) {
    try {
      const { maKhachHang } = req.params;
      const taiKhoan = await taiKhoanKhachHangService.layTheoMa(maKhachHang);
      if (!taiKhoan) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
      }
      return res.json(taiKhoan.toJSON());
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  },

  async capNhat(req, res) {
    try {
      const { maKhachHang } = req.params;
      const capNhat = await taiKhoanKhachHangService.capNhat(maKhachHang, req.body);
      if (!capNhat) {
        return res.status(400).json({ message: 'Không thể cập nhật tài khoản.' });
      }
      return res.json({ message: 'Cập nhật thành công', user: capNhat.toJSON() });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  },

  async xoa(req, res) {
    try {
      const { maKhachHang } = req.params;
      const ketQua = await taiKhoanKhachHangService.xoa(maKhachHang);
      if (!ketQua) {
        return res.status(400).json({ message: 'Không thể xoá tài khoản.' });
      }
      return res.json({ message: 'Đã xoá tài khoản', user: ketQua.toJSON() });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
  }
};

module.exports = TaiKhoanKhachHangController;

