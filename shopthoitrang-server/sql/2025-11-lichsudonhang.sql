-- Bảng lưu lịch sử thay đổi trạng thái đơn hàng
-- Ghi log mỗi khi nhân viên duyệt/thay đổi trạng thái đơn

CREATE TABLE IF NOT EXISTS lichsudonhang (
  id SERIAL PRIMARY KEY,
  madonhang INTEGER NOT NULL REFERENCES donhang(madonhang) ON DELETE CASCADE,
  manhanvien INTEGER REFERENCES nhanvien(manhanvien) ON DELETE SET NULL,
  trangthaicu VARCHAR(50),
  trangthaimoi VARCHAR(50),
  ghichu TEXT, -- lý do hủy, ghi chú thêm
  thoigian TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_lichsudonhang_madonhang ON lichsudonhang(madonhang);
CREATE INDEX IF NOT EXISTS idx_lichsudonhang_manhanvien ON lichsudonhang(manhanvien);
CREATE INDEX IF NOT EXISTS idx_lichsudonhang_thoigian ON lichsudonhang(thoigian DESC);

-- Comment
COMMENT ON TABLE lichsudonhang IS 'Lịch sử thay đổi trạng thái đơn hàng, ghi log nhân viên duyệt';
COMMENT ON COLUMN lichsudonhang.madonhang IS 'Mã đơn hàng';
COMMENT ON COLUMN lichsudonhang.manhanvien IS 'Mã nhân viên thực hiện thay đổi';
COMMENT ON COLUMN lichsudonhang.trangthaicu IS 'Trạng thái cũ của đơn hàng';
COMMENT ON COLUMN lichsudonhang.trangthaimoi IS 'Trạng thái mới của đơn hàng';
COMMENT ON COLUMN lichsudonhang.ghichu IS 'Ghi chú thêm (lý do hủy, v.v.)';
COMMENT ON COLUMN lichsudonhang.thoigian IS 'Thời điểm thay đổi';
