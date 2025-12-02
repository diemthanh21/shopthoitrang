-- Membership point fields (run once)
ALTER TABLE public.thethanhvien
  ADD COLUMN IF NOT EXISTS diem_hien_tai numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diem_pending numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diem_nam_hien_tai numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nam_diem integer NOT NULL DEFAULT (extract(year from (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int),
  ADD COLUMN IF NOT EXISTS last_reset_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

-- Ledger table to track earn/spend & pending conversions
CREATE TABLE IF NOT EXISTS public.thethanhvien_point_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mathe integer NOT NULL REFERENCES public.thethanhvien(mathe),
  makhachhang integer NOT NULL REFERENCES public.taikhoankhachhang(makhachhang),
  madonhang integer,
  type text NOT NULL DEFAULT 'EARN', -- EARN | SPEND | ADJUST
  diem numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  available_at timestamptz,
  released_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_pending ON public.thethanhvien_point_ledger (status, available_at);
CREATE INDEX IF NOT EXISTS idx_point_ledger_order ON public.thethanhvien_point_ledger (madonhang);
