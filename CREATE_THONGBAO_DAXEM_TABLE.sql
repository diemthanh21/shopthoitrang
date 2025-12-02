-- Tạo bảng lưu trạng thái đã xem thông báo
CREATE TABLE IF NOT EXISTS thongbao_daxem (
  id SERIAL PRIMARY KEY,
  manhanvien INTEGER NOT NULL REFERENCES nhanvien(manhanvien) ON DELETE CASCADE,
  entity VARCHAR(50) NOT NULL, -- 'CHOTCA', 'PHIEUDATHANG', 'PHIEUNHAPKHO', 'DOIHANG', 'TRAHANG'
  entity_id INTEGER NOT NULL, -- ID của entity tương ứng
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'APPROVED', 'REJECTED', 'COMPLETED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(manhanvien, entity, entity_id, action)
);

-- Tạo index để truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_thongbao_daxem_manhanvien ON thongbao_daxem(manhanvien);
CREATE INDEX IF NOT EXISTS idx_thongbao_daxem_entity ON thongbao_daxem(entity, entity_id);

-- Thêm comment
COMMENT ON TABLE thongbao_daxem IS 'Bảng lưu trạng thái nhân viên đã xem thông báo nào';
COMMENT ON COLUMN thongbao_daxem.entity IS 'Loại thông báo: CHOTCA, PHIEUDATHANG, PHIEUNHAPKHO, DOIHANG, TRAHANG';
COMMENT ON COLUMN thongbao_daxem.entity_id IS 'ID của entity (machotca, maphieudathang, maphieunhap, etc.)';
COMMENT ON COLUMN thongbao_daxem.action IS 'Hành động: CREATED, APPROVED, REJECTED, COMPLETED';
