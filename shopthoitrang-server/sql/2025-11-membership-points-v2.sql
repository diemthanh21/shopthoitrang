-- BẢNG THẺ THÀNH VIÊN V2 (chỉ tích điểm, không hạng)
-- Drop bảng cũ nếu cần và tạo lại với cấu trúc mới

-- Backup dữ liệu cũ (nếu cần)
-- CREATE TABLE IF NOT EXISTS thethanhvien_backup AS SELECT * FROM public.thethanhvien;

-- Drop ràng buộc và index cũ
DROP INDEX IF EXISTS public.uq_the_active_per_kh;
DROP INDEX IF EXISTS public.idx_the_kh;

-- Xóa các cột cũ không còn dùng (mahangthe, tier_snapshot, tichluy_khi_cap)
ALTER TABLE public.thethanhvien 
  DROP COLUMN IF EXISTS mahangthe,
  DROP COLUMN IF EXISTS tier_snapshot,
  DROP COLUMN IF EXISTS tichluy_khi_cap;

-- Thêm/cập nhật các cột mới
ALTER TABLE public.thethanhvien
  ADD COLUMN IF NOT EXISTS trangthai boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS diem_hien_tai numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diem_pending numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diem_nam_hien_tai numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nam_diem integer NOT NULL 
    DEFAULT (extract(year from (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int),
  ADD COLUMN IF NOT EXISTS last_reset_at timestamp without time zone 
    DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone 
    DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

-- Constraint không cho điểm âm
ALTER TABLE public.thethanhvien 
  DROP CONSTRAINT IF EXISTS chk_the_diem_nonneg;

ALTER TABLE public.thethanhvien 
  ADD CONSTRAINT chk_the_diem_nonneg CHECK (
    diem_hien_tai >= 0
    AND diem_pending >= 0
    AND diem_nam_hien_tai >= 0
  );

-- Mỗi khách chỉ có 1 thẻ đang hoạt động
CREATE UNIQUE INDEX IF NOT EXISTS uq_the_active_per_kh
ON public.thethanhvien (makhachhang)
WHERE trangthai = true;

-- Index phụ để lọc nhanh theo khách
CREATE INDEX IF NOT EXISTS idx_the_kh
ON public.thethanhvien (makhachhang);

-- Index cho việc reset điểm hàng năm
CREATE INDEX IF NOT EXISTS idx_the_reset
ON public.thethanhvien (nam_diem, last_reset_at)
WHERE trangthai = true;

-- =============================================
-- BẢNG GIAO DỊCH ĐIỂM (PENDING 7 NGÀY)
-- =============================================
CREATE TABLE IF NOT EXISTS public.thethanhvien_point_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mathe integer NOT NULL REFERENCES public.thethanhvien(mathe) ON DELETE CASCADE,
  makhachhang integer NOT NULL REFERENCES public.taikhoankhachhang(makhachhang),
  madonhang integer REFERENCES public.donhang(madonhang),
  
  type text NOT NULL DEFAULT 'EARN', -- EARN | SPEND | ADJUST | RETURN | EXCHANGE
  diem numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | CANCELLED
  
  -- Thời gian
  ngaytao timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  available_at timestamptz, -- Ngày có thể dùng điểm (sau 7 ngày)
  approved_at timestamptz,  -- Ngày thực tế được duyệt
  
  note text,
  metadata jsonb, -- Lưu thông tin thêm (giá trị đơn hàng, lý do trả/đổi, v.v.)
  
  created_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  updated_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
);

-- Indexes cho bảng giao dịch điểm
CREATE INDEX IF NOT EXISTS idx_point_tx_mathe ON public.thethanhvien_point_transactions(mathe);
CREATE INDEX IF NOT EXISTS idx_point_tx_khachhang ON public.thethanhvien_point_transactions(makhachhang);
CREATE INDEX IF NOT EXISTS idx_point_tx_donhang ON public.thethanhvien_point_transactions(madonhang);
CREATE INDEX IF NOT EXISTS idx_point_tx_status ON public.thethanhvien_point_transactions(status);
CREATE INDEX IF NOT EXISTS idx_point_tx_pending_due 
  ON public.thethanhvien_point_transactions(status, available_at)
  WHERE status = 'PENDING';

-- =============================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_thethanhvien_updated_at ON public.thethanhvien;
CREATE TRIGGER update_thethanhvien_updated_at
  BEFORE UPDATE ON public.thethanhvien
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_point_tx_updated_at ON public.thethanhvien_point_transactions;
CREATE TRIGGER update_point_tx_updated_at
  BEFORE UPDATE ON public.thethanhvien_point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION RESET ĐIỂM HÀNG NĂM
-- =============================================
CREATE OR REPLACE FUNCTION reset_yearly_points()
RETURNS TABLE(
  cards_reset integer,
  points_cleared numeric
) AS $$
DECLARE
  current_year integer;
  reset_count integer := 0;
  total_points numeric := 0;
BEGIN
  current_year := extract(year from (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int;
  
  -- Reset các thẻ có nam_diem khác năm hiện tại
  WITH reset_cards AS (
    UPDATE public.thethanhvien
    SET 
      diem_hien_tai = 0,
      diem_pending = 0,
      diem_nam_hien_tai = 0,
      nam_diem = current_year,
      last_reset_at = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
    WHERE trangthai = true 
      AND nam_diem < current_year
    RETURNING mathe, diem_hien_tai + diem_pending as cleared
  )
  SELECT COUNT(*)::integer, COALESCE(SUM(cleared), 0)
  INTO reset_count, total_points
  FROM reset_cards;
  
  RETURN QUERY SELECT reset_count, total_points;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENT
-- =============================================
COMMENT ON TABLE public.thethanhvien IS 'Thẻ thành viên - chỉ tích điểm, không hạng';
COMMENT ON TABLE public.thethanhvien_point_transactions IS 'Giao dịch điểm tích lũy với flow pending 7 ngày';
COMMENT ON COLUMN public.thethanhvien.diem_hien_tai IS 'Điểm đã được duyệt và có thể sử dụng';
COMMENT ON COLUMN public.thethanhvien.diem_pending IS 'Điểm chờ duyệt (7 ngày sau khi giao hàng)';
COMMENT ON COLUMN public.thethanhvien.diem_nam_hien_tai IS 'Điểm tích lũy trong năm hiện tại (reset đầu năm)';
COMMENT ON FUNCTION reset_yearly_points() IS 'Reset điểm tích lũy về 0 khi sang năm mới';

