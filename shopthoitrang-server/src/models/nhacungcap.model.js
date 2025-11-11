class NhaCungCap {
  constructor({
    manhacungcap,
    tennhacungcap,
    email,
    diachi,
    sodienthoai,
  }) {
    // Thuộc tính dùng trong code (camelCase)
    this.maNhaCungCap = manhacungcap;
    this.tenNhaCungCap = tennhacungcap;
    this.email = email;
    this.diaChi = diachi;
    this.soDienThoai = sodienthoai;
  }

  toJSON() {
    // Dạng dữ liệu trả ra / lưu xuống DB (snake_case / lowercase)
    return {
      manhacungcap: this.maNhaCungCap,
      tennhacungcap: this.tenNhaCungCap,
      email: this.email,
      diachi: this.diaChi,
      sodienthoai: this.soDienThoai,
    };
  }
}

module.exports = NhaCungCap;
