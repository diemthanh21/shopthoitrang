-- Tạo bảng lưu log thông báo chốt ca
CREATE TABLE IF NOT EXISTS chotca_log (
  id SERIAL PRIMARY KEY,
  machotca INTEGER NOT NULL REFERENCES chotca(machotca) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'APPROVED', 'REJECTED'
  note TEXT,
  actor_type VARCHAR(50), -- 'NHANVIEN', 'ADMIN', 'SYSTEM'
  actor_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_chotca_log_machotca ON chotca_log(machotca);
CREATE INDEX IF NOT EXISTS idx_chotca_log_created_at ON chotca_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chotca_log_action ON chotca_log(action);

-- Thêm comment
COMMENT ON TABLE chotca_log IS 'Bảng lưu lịch sử và thông báo liên quan đến chốt ca';
COMMENT ON COLUMN chotca_log.action IS 'Hành động: CREATED (tạo mới), APPROVED (duyệt), REJECTED (từ chối)';
COMMENT ON COLUMN chotca_log.actor_type IS 'Loại người thực hiện: NHANVIEN, ADMIN, SYSTEM';
COMMENT ON COLUMN chotca_log.actor_id IS 'ID của người thực hiện hành động';
