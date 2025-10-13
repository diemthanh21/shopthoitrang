  class NhanVien {
    constructor({
      manhanvien,
      hoten,
      gioitinh,
      cccd,
      ngaycap,
      noicap,
      ngaybatdau,
      ngayhethan,
      trangthai,
      luong,
      email,
      sodienthoai,
      ngaysinh,
      diachi,
      machucnang,
    }) 
    {
      this.maNhanVien = manhanvien;
      this.hoTen = hoten;
      this.gioiTinh = gioitinh;
      this.cccd = cccd;
      this.ngayCap = ngaycap;
      this.noiCap = noicap;
      this.ngayBatDau = ngaybatdau;
      this.ngayHetHan = ngayhethan;
      this.trangThai = trangthai;
      this.luong = luong;
      this.email = email;
      this.soDienThoai = sodienthoai;
      this.ngaySinh = ngaysinh;
      this.diaChi = diachi;
      this.maChucNang = machucnang;
    }

    toJSON() {
      return {
        manhanvien: this.maNhanVien,
        hoten: this.hoTen,
        gioitinh: this.gioiTinh,
        cccd: this.cccd,
        ngaycap: this.ngayCap,
        noicap: this.noiCap,
        ngaybatdau: this.ngayBatDau,
        ngayhethan: this.ngayHetHan,
        trangthai: this.trangThai,
        luong: this.luong,
        email: this.email,
        sodienthoai: this.soDienThoai,
        ngaysinh: this.ngaySinh,
        diachi: this.diaChi,
        machucnang: this.maChucNang,
      };
    }
  }

  module.exports = NhanVien;
