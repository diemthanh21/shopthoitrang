-- Migration: Thêm cột manhanvien vào bảng noidungchat để hiển thị nhân viên gửi từng tin nhắn
-- SAFE chạy nhiều lần

BEGIN;

ALTER TABLE IF EXISTS public.noidungchat
  ADD COLUMN IF NOT EXISTS manhanvien BIGINT;

COMMENT ON COLUMN public.noidungchat.manhanvien IS 'Mã nhân viên đã gửi tin (nếu nguoigui = NV)';

CREATE INDEX IF NOT EXISTS idx_noidungchat_manhanvien ON public.noidungchat(manhanvien);
CREATE INDEX IF NOT EXISTS idx_noidungchat_machatbox ON public.noidungchat(machatbox);

COMMIT;
