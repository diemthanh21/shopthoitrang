-- Tạo bảng lưu log thông báo phiếu nhập kho
CREATE TABLE IF NOT EXISTS phieunhapkho_log (
  id SERIAL PRIMARY KEY,
  maphieunhap INTEGER NOT NULL REFERENCES phieunhapkho(maphieunhap) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'APPROVED', 'REJECTED'
  note TEXT,
  actor_type VARCHAR(50), -- 'NHANVIEN', 'ADMIN', 'SYSTEM'
  actor_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_maphieunhap ON phieunhapkho_log(maphieunhap);
CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_created_at ON phieunhapkho_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_action ON phieunhapkho_log(action);

-- Thêm comment
COMMENT ON TABLE phieunhapkho_log IS 'Bảng lưu lịch sử và thông báo liên quan đến phiếu nhập kho';
COMMENT ON COLUMN phieunhapkho_log.action IS 'Hành động: CREATED (tạo mới/hoàn tất), APPROVED (duyệt), REJECTED (từ chối)';
COMMENT ON COLUMN phieunhapkho_log.actor_type IS 'Loại người thực hiện: NHANVIEN, ADMIN, SYSTEM';
COMMENT ON COLUMN phieunhapkho_log.actor_id IS 'ID của người thực hiện hành động';
