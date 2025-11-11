-- Migration: Thêm cột madiachi vào bảng donhang để lưu đúng địa chỉ giao hàng khách chọn lúc checkout
-- SAFE to run multiple times (IF NOT EXISTS)

BEGIN;

-- 1) Thêm cột nếu chưa có
ALTER TABLE IF EXISTS public.donhang
  ADD COLUMN IF NOT EXISTS madiachi BIGINT;

-- 2) Ghi chú và index để truy vấn nhanh
COMMENT ON COLUMN public.donhang.madiachi IS 'Mã địa chỉ khách hàng đã chọn khi đặt hàng (snapshot nằm ở bảng diachigiaohang)';

CREATE INDEX IF NOT EXISTS idx_donhang_madiachi ON public.donhang(madiachi);

-- 3) (Tuỳ chọn) Ràng buộc khoá ngoại tới diachikhachhang
-- LƯU Ý: Supabase hiện không hỗ trợ IF NOT EXISTS cho CONSTRAINT, nên đoạn dưới để tham khảo.
-- Có thể thêm thủ công trong SQL editor nếu cần tính toàn vẹn chặt chẽ.
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.table_constraints 
--     WHERE constraint_name = 'fk_donhang_madiachi' AND table_name = 'donhang'
--   ) THEN
--     ALTER TABLE public.donhang
--       ADD CONSTRAINT fk_donhang_madiachi
--       FOREIGN KEY (madiachi)
--       REFERENCES public.diachikhachhang(madiachi)
--       ON DELETE SET NULL;
--   END IF;
-- END $$;

COMMIT;

-- Sau khi chạy file này, nên chạy thêm CREATE_DIA_CHI_GIAO_HANG.sql để bật bảng snapshot địa chỉ mỗi đơn.
