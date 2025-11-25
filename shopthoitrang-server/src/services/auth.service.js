<<<<<<< HEAD
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const TaiKhoanKhachHangRepository = require('../repositories/taikhoankhachhang.repository');
const TaiKhoanNhanVienRepository = require('../repositories/taikhoannhanvien.repository');
const membershipService = require('./membership.service');

const SALT_ROUNDS = 10;

const AuthService = {
  /**
   * Hash mật khẩu
   */
  async hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  /**
   * So sánh mật khẩu (hỗ trợ cả plain text và hashed)
   */
  async comparePassword(plainPassword, storedPassword) {
    // Kiểm tra nếu password là null hoặc undefined
    if (!storedPassword) {
      return false;
    }

    // Kiểm tra nếu password là plain text (chưa hash)
    // Bcrypt hash luôn bắt đầu với $2a$, $2b$, hoặc $2y$ và có độ dài >= 60
    const isBcryptHash = storedPassword.startsWith('$2a$') || 
                         storedPassword.startsWith('$2b$') || 
                         storedPassword.startsWith('$2y$');

    if (!isBcryptHash) {
      // Password chưa được hash (plain text) - so sánh trực tiếp
      console.warn('⚠️  WARNING: Plain text password detected. Please migrate to hashed passwords!');
      return plainPassword === storedPassword;
    }

    // Password đã được hash - sử dụng bcrypt compare
    return await bcrypt.compare(plainPassword, storedPassword);
  },

  /**
   * Đăng ký khách hàng mới
   */
  async registerCustomer(payload) {
    const { email, matkhau, hoten, sodienthoai, tendangnhap, gioitinh, ngaysinh } = payload;

    // Kiểm tra email đã tồn tại
    const existingCustomers = await TaiKhoanKhachHangRepository.getAll({ email });
    if (existingCustomers.length > 0) {
      throw new Error('Email đã được sử dụng');
    }

  // Hash mật khẩu
  const hashedPassword = await this.hashPassword(matkhau);

    // Xây dựng payload chỉ gồm các cột chắc chắn tồn tại để tránh lỗi schema
    const usernameFromEmail = (email || '').split('@')[0] || email;
    const insertPayload = {
      email,
      pass: hashedPassword,   // cột mật khẩu là 'pass'
      hoten,
      tendangnhap: tendangnhap || usernameFromEmail,
    };
    if (sodienthoai) insertPayload.sodienthoai = sodienthoai;
    if (gioitinh) insertPayload.gioitinh = gioitinh;
    if (ngaysinh) insertPayload.ngaysinh = ngaysinh;

    // Tạo tài khoản mới
    const newCustomer = await TaiKhoanKhachHangRepository.create(insertPayload);
    try {
      await membershipService.ensureDefaultCard(newCustomer.makhachhang);
    } catch (err) {
      console.error('[AuthService] Khong the khoi tao the thanh vien mac dinh:', err?.message || err);
    }
    // Tạo JWT token
    const token = generateToken({
      makhachhang: newCustomer.makhachhang,
      email: newCustomer.email,
      role: 'customer'
    });

    return {
      user: {
        makhachhang: newCustomer.makhachhang,
        email: newCustomer.email,
        hoten: newCustomer.hoten,
        tendangnhap: newCustomer.tendangnhap,
        sodienthoai: newCustomer.sodienthoai,
        gioitinh: newCustomer.gioitinh,
        ngaysinh: newCustomer.ngaysinh
      },
      token
    };
  },

  /**
   * Đăng nhập khách hàng
   */
  async loginCustomer(email, matkhau) {
    // Tìm khách hàng theo email
    const customers = await TaiKhoanKhachHangRepository.getAll({ email });
    
    if (customers.length === 0) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const customer = customers[0];

    // Kiểm tra tài khoản có đang hoạt động
    if (customer.dangHoatDong === false || customer.danghoatdong === false) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Lấy password từ model (model chuyển pass -> matKhau)
    const storedPassword = customer.matKhau || customer.pass;
    
    if (!storedPassword) {
      throw new Error('Tài khoản chưa có mật khẩu');
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await this.comparePassword(matkhau, storedPassword);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Nếu password là plain text, tự động hash và cập nhật
    const isPlainText = !storedPassword.startsWith('$2a$') && 
                        !storedPassword.startsWith('$2b$') && 
                        !storedPassword.startsWith('$2y$');
    
    if (isPlainText) {
      console.log(`🔄 Auto-migrating password for customer: ${email}`);
      const hashedPassword = await this.hashPassword(matkhau);
      await TaiKhoanKhachHangRepository.update(customer.maKhachHang || customer.makhachhang, {
        pass: hashedPassword
      });
    }

    // Tạo JWT token
    const token = generateToken({
      makhachhang: customer.maKhachHang || customer.makhachhang,
      email: customer.email,
      role: 'customer'
    });

    return {
      user: {
        makhachhang: customer.maKhachHang || customer.makhachhang,
        email: customer.email,
        hoten: customer.hoTen || customer.hoten,
        tendangnhap: customer.tenDangNhap || customer.tendangnhap,
        sodienthoai: customer.soDienThoai || customer.sodienthoai,
        gioitinh: customer.gioiTinh || customer.gioitinh,
        ngaysinh: customer.ngaySinh || customer.ngaysinh,
        diachi: customer.diachi
      },
      token
    };
  },

  /**
   * Đăng nhập nhân viên
   */
  async loginEmployee(tendangnhap, matkhau) {
    // Tìm nhân viên theo tên đăng nhập
    const employee = await TaiKhoanNhanVienRepository.getByUsername(tendangnhap);
    
    if (!employee) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Kiểm tra trạng thái hoạt động của tài khoản
    if (employee.dangHoatDong === false || employee.danghoatdong === false) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Lấy password từ model (model chuyển matkhau -> matKhau)
    const storedPassword = employee.matKhau || employee.matkhau;
    
    if (!storedPassword) {
      throw new Error('Tài khoản chưa có mật khẩu');
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await this.comparePassword(matkhau, storedPassword);
    if (!isPasswordValid) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Nếu password là plain text, tự động hash và cập nhật
    const isPlainText = !storedPassword.startsWith('$2a$') && 
                        !storedPassword.startsWith('$2b$') && 
                        !storedPassword.startsWith('$2y$');
    
    if (isPlainText) {
      console.log(`🔄 Auto-migrating password for employee: ${tendangnhap}`);
      const hashedPassword = await this.hashPassword(matkhau);
      await TaiKhoanNhanVienRepository.update(employee.maNhanVien || employee.manhanvien, {
        matkhau: hashedPassword
      });
    }

    // Tạo JWT token với quyền nhân viên
    const token = generateToken({
      manhanvien: employee.maNhanVien || employee.manhanvien,
      tendangnhap: employee.tenDangNhap || employee.tendangnhap,
      role: 'employee'
    });

    return {
      user: {
        manhanvien: employee.maNhanVien || employee.manhanvien,
        tendangnhap: employee.tenDangNhap || employee.tendangnhap
      },
      token
    };
  },

  /**
   * Đổi mật khẩu khách hàng
   */
  async changeCustomerPassword(makhachhang, matkhaucu, matkhaumoi) {
    const customer = await TaiKhoanKhachHangRepository.getById(makhachhang);
    
    if (!customer) {
      throw new Error('Không tìm thấy tài khoản');
    }

  // Kiểm tra mật khẩu cũ (model ánh xạ pass -> matKhau)
  const isPasswordValid = await this.comparePassword(matkhaucu, customer.matKhau);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await this.hashPassword(matkhaumoi);

    // Cập nhật mật khẩu (cột 'pass')
    await TaiKhoanKhachHangRepository.update(makhachhang, {
      pass: hashedNewPassword
    });

    return { message: 'Đổi mật khẩu thành công' };
  },

  /**
   * Đổi mật khẩu nhân viên
   */
  async changeEmployeePassword(manhanvien, matkhaucu, matkhaumoi) {
    const employee = await TaiKhoanNhanVienRepository.getById(manhanvien);
    
    if (!employee) {
      throw new Error('Không tìm thấy tài khoản');
    }

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await this.comparePassword(matkhaucu, employee.matkhau);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await this.hashPassword(matkhaumoi);

    // Cập nhật mật khẩu
    await TaiKhoanNhanVienRepository.update(manhanvien, {
      matkhau: hashedNewPassword
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
};

module.exports = AuthService;
=======
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const TaiKhoanKhachHangRepository = require('../repositories/taikhoankhachhang.repository');
const TaiKhoanNhanVienRepository = require('../repositories/taikhoannhanvien.repository');
const membershipService = require('./membership.service');

const SALT_ROUNDS = 10;

const AuthService = {
  /**
   * Hash mật khẩu
   */
  async hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  /**
   * So sánh mật khẩu (hỗ trợ cả plain text và hashed)
   */
  async comparePassword(plainPassword, storedPassword) {
    // Kiểm tra nếu password là null hoặc undefined
    if (!storedPassword) {
      return false;
    }

    // Kiểm tra nếu password là plain text (chưa hash)
    // Bcrypt hash luôn bắt đầu với $2a$, $2b$, hoặc $2y$ và có độ dài >= 60
    const isBcryptHash = storedPassword.startsWith('$2a$') || 
                         storedPassword.startsWith('$2b$') || 
                         storedPassword.startsWith('$2y$');

    if (!isBcryptHash) {
      // Password chưa được hash (plain text) - so sánh trực tiếp
      console.warn('⚠️  WARNING: Plain text password detected. Please migrate to hashed passwords!');
      return plainPassword === storedPassword;
    }

    // Password đã được hash - sử dụng bcrypt compare
    return await bcrypt.compare(plainPassword, storedPassword);
  },

  /**
   * Đăng ký khách hàng mới
   */
  async registerCustomer(payload) {
    const { email, matkhau, hoten, sodienthoai, tendangnhap, gioitinh, ngaysinh } = payload;

    // Kiểm tra email đã tồn tại
    const existingCustomers = await TaiKhoanKhachHangRepository.getAll({ email });
    if (existingCustomers.length > 0) {
      throw new Error('Email đã được sử dụng');
    }

  // Hash mật khẩu
  const hashedPassword = await this.hashPassword(matkhau);

    // Xây dựng payload chỉ gồm các cột chắc chắn tồn tại để tránh lỗi schema
    const usernameFromEmail = (email || '').split('@')[0] || email;
    const insertPayload = {
      email,
      pass: hashedPassword,   // cột mật khẩu là 'pass'
      hoten,
      tendangnhap: tendangnhap || usernameFromEmail,
    };
    if (sodienthoai) insertPayload.sodienthoai = sodienthoai;
    if (gioitinh) insertPayload.gioitinh = gioitinh;
    if (ngaysinh) insertPayload.ngaysinh = ngaysinh;

    // Tạo tài khoản mới
    const newCustomer = await TaiKhoanKhachHangRepository.create(insertPayload);
    try {
      await membershipService.ensureDefaultCard(newCustomer.makhachhang);
    } catch (err) {
      console.error('[AuthService] Khong the khoi tao the thanh vien mac dinh:', err?.message || err);
    }
    // Tạo JWT token
    const token = generateToken({
      makhachhang: newCustomer.makhachhang,
      email: newCustomer.email,
      role: 'customer'
    });

    return {
      user: {
        makhachhang: newCustomer.makhachhang,
        email: newCustomer.email,
        hoten: newCustomer.hoten,
        tendangnhap: newCustomer.tendangnhap,
        sodienthoai: newCustomer.sodienthoai,
        gioitinh: newCustomer.gioitinh,
        ngaysinh: newCustomer.ngaysinh
      },
      token
    };
  },

  /**
   * Đăng nhập khách hàng
   */
  async loginCustomer(email, matkhau) {
    // Tìm khách hàng theo email
    const customers = await TaiKhoanKhachHangRepository.getAll({ email });
    
    if (customers.length === 0) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const customer = customers[0];

    // Kiểm tra tài khoản có đang hoạt động
    if (customer.dangHoatDong === false || customer.danghoatdong === false) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Lấy password từ model (model chuyển pass -> matKhau)
    const storedPassword = customer.matKhau || customer.pass;
    
    if (!storedPassword) {
      throw new Error('Tài khoản chưa có mật khẩu');
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await this.comparePassword(matkhau, storedPassword);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Nếu password là plain text, tự động hash và cập nhật
    const isPlainText = !storedPassword.startsWith('$2a$') && 
                        !storedPassword.startsWith('$2b$') && 
                        !storedPassword.startsWith('$2y$');
    
    if (isPlainText) {
      console.log(`🔄 Auto-migrating password for customer: ${email}`);
      const hashedPassword = await this.hashPassword(matkhau);
      await TaiKhoanKhachHangRepository.update(customer.maKhachHang || customer.makhachhang, {
        pass: hashedPassword
      });
    }

    // Tạo JWT token
    const token = generateToken({
      makhachhang: customer.maKhachHang || customer.makhachhang,
      email: customer.email,
      role: 'customer'
    });

    return {
      user: {
        makhachhang: customer.maKhachHang || customer.makhachhang,
        email: customer.email,
        hoten: customer.hoTen || customer.hoten,
        tendangnhap: customer.tenDangNhap || customer.tendangnhap,
        sodienthoai: customer.soDienThoai || customer.sodienthoai,
        gioitinh: customer.gioiTinh || customer.gioitinh,
        ngaysinh: customer.ngaySinh || customer.ngaysinh,
        diachi: customer.diachi
      },
      token
    };
  },

  /**
   * Đăng nhập nhân viên
   */
  async loginEmployee(tendangnhap, matkhau) {
    // Tìm nhân viên theo tên đăng nhập
    const employee = await TaiKhoanNhanVienRepository.getByUsername(tendangnhap);
    
    if (!employee) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Kiểm tra trạng thái hoạt động của tài khoản
    if (employee.dangHoatDong === false || employee.danghoatdong === false) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Lấy password từ model (model chuyển matkhau -> matKhau)
    const storedPassword = employee.matKhau || employee.matkhau;
    
    if (!storedPassword) {
      throw new Error('Tài khoản chưa có mật khẩu');
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await this.comparePassword(matkhau, storedPassword);
    if (!isPasswordValid) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Nếu password là plain text, tự động hash và cập nhật
    const isPlainText = !storedPassword.startsWith('$2a$') && 
                        !storedPassword.startsWith('$2b$') && 
                        !storedPassword.startsWith('$2y$');
    
    if (isPlainText) {
      console.log(`🔄 Auto-migrating password for employee: ${tendangnhap}`);
      const hashedPassword = await this.hashPassword(matkhau);
      await TaiKhoanNhanVienRepository.update(employee.maNhanVien || employee.manhanvien, {
        matkhau: hashedPassword
      });
    }

    // Tạo JWT token với quyền nhân viên
    const token = generateToken({
      manhanvien: employee.maNhanVien || employee.manhanvien,
      tendangnhap: employee.tenDangNhap || employee.tendangnhap,
      role: 'employee'
    });

    return {
      user: {
        manhanvien: employee.maNhanVien || employee.manhanvien,
        tendangnhap: employee.tenDangNhap || employee.tendangnhap
      },
      token
    };
  },

  /**
   * Đổi mật khẩu khách hàng
   */
  async changeCustomerPassword(makhachhang, matkhaucu, matkhaumoi) {
    const customer = await TaiKhoanKhachHangRepository.getById(makhachhang);
    
    if (!customer) {
      throw new Error('Không tìm thấy tài khoản');
    }

  // Kiểm tra mật khẩu cũ (model ánh xạ pass -> matKhau)
  const isPasswordValid = await this.comparePassword(matkhaucu, customer.matKhau);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await this.hashPassword(matkhaumoi);

    // Cập nhật mật khẩu (cột 'pass')
    await TaiKhoanKhachHangRepository.update(makhachhang, {
      pass: hashedNewPassword
    });

    return { message: 'Đổi mật khẩu thành công' };
  },

  /**
   * Đổi mật khẩu nhân viên
   */
  async changeEmployeePassword(manhanvien, matkhaucu, matkhaumoi) {
    const employee = await TaiKhoanNhanVienRepository.getById(manhanvien);
    
    if (!employee) {
      throw new Error('Không tìm thấy tài khoản');
    }

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await this.comparePassword(matkhaucu, employee.matkhau);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await this.hashPassword(matkhaumoi);

    // Cập nhật mật khẩu
    await TaiKhoanNhanVienRepository.update(manhanvien, {
      matkhau: hashedNewPassword
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
};

module.exports = AuthService;

>>>>>>> origin/tram-e
