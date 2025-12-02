-- Tạo bảng lưu log thông báo phiếu đặt hàng
CREATE TABLE IF NOT EXISTS phieudathang_log (
  id SERIAL PRIMARY KEY,
  maphieudathang INTEGER NOT NULL REFERENCES phieudathang(maphieudathang) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'APPROVED', 'REJECTED'
  note TEXT,
  actor_type VARCHAR(50), -- 'NHANVIEN', 'ADMIN', 'SYSTEM'
  actor_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_phieudathang_log_maphieudathang ON phieudathang_log(maphieudathang);
CREATE INDEX IF NOT EXISTS idx_phieudathang_log_created_at ON phieudathang_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phieudathang_log_action ON phieudathang_log(action);

-- Thêm comment
COMMENT ON TABLE phieudathang_log IS 'Bảng lưu lịch sử và thông báo liên quan đến phiếu đặt hàng';
COMMENT ON COLUMN phieudathang_log.action IS 'Hành động: CREATED (tạo mới/hoàn tất), APPROVED (duyệt), REJECTED (từ chối)';
COMMENT ON COLUMN phieudathang_log.actor_type IS 'Loại người thực hiện: NHANVIEN, ADMIN, SYSTEM';
COMMENT ON COLUMN phieudathang_log.actor_id IS 'ID của người thực hiện hành động';
