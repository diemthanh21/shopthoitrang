class DiaChiKhachHang {
  constructor({ 
    madiachi, 
    makhachhang, 
    diachi,
    ten,
    sodienthoai,
    tinh,
    phuong,
    diachicuthe,
    macdinh
  }) {
    this.madiachi = madiachi;
    this.makhachhang = makhachhang;
    
    // Backward compatibility: nếu có diachi (string cũ) thì parse
    if (diachi && !ten) {
      const parts = diachi.split('|').map(p => p.trim());
      this.ten = parts[0] || '';
      this.sodienthoai = parts[1] || '';
      const location = parts[2] || '';
      const locationParts = location.split(',').map(p => p.trim());
      this.tinh = locationParts[0] || '';
      this.phuong = locationParts[1] || '';
      this.diachicuthe = parts[3] || '';
      this.diachi = diachi; // Keep for backward compatibility
    } else {
      // New structure
      this.ten = ten || '';
      this.sodienthoai = sodienthoai || '';
      this.tinh = tinh || '';
      this.phuong = phuong || '';
      this.diachicuthe = diachicuthe || '';
      // Generate diachi string for backward compatibility
      this.diachi = diachi || `${ten || ''} | ${sodienthoai || ''} | ${tinh || ''}, ${phuong || ''} | ${diachicuthe || ''}`;
    }
    
    this.macdinh = macdinh || false;
  }

  toJSON() {
    return {
      madiachi: this.madiachi,
      makhachhang: this.makhachhang,
      ten: this.ten,
      sodienthoai: this.sodienthoai,
      tinh: this.tinh,
      phuong: this.phuong,
      diachicuthe: this.diachicuthe,
      macdinh: this.macdinh,
      diachi: this.diachi, // Keep for backward compatibility
    };
  }
}

module.exports = DiaChiKhachHang;
