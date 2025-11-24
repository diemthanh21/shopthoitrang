-- Bảng lưu lịch sử sử dụng mã giảm giá
-- Mỗi lần khách hàng đặt hàng với mã giảm giá sẽ tạo 1 record

CREATE TABLE IF NOT EXISTS public.magiamgia_sudung (
    id SERIAL PRIMARY KEY,
    magiamgia VARCHAR(50) NOT NULL REFERENCES public.magiamgia(magiamgia) ON DELETE CASCADE,
    makhachhang INTEGER NOT NULL REFERENCES public.taikhoankhachhang(makhachhang) ON DELETE CASCADE,
    madonhang INTEGER NOT NULL REFERENCES public.donhang(madonhang) ON DELETE CASCADE,
    ngaysudung TIMESTAMPTZ DEFAULT NOW(),
    sotiengiamgia DECIMAL(15, 2) DEFAULT 0,
    
    -- Indexes for performance
    CONSTRAINT unique_order_coupon UNIQUE (madonhang, magiamgia)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_magiamgia ON public.magiamgia_sudung(magiamgia);
CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_makhachhang ON public.magiamgia_sudung(makhachhang);
CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_madonhang ON public.magiamgia_sudung(madonhang);
CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_ngaysudung ON public.magiamgia_sudung(ngaysudung);

-- Enable RLS
ALTER TABLE public.magiamgia_sudung ENABLE ROW LEVEL SECURITY;

-- Policy: Admin có thể làm tất cả
CREATE POLICY "Admin full access on magiamgia_sudung"
ON public.magiamgia_sudung
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.taikhoannhanvien
        WHERE taikhoannhanvien.manhanvien = (auth.jwt() ->> 'user_id')::INTEGER
    )
);

-- Policy: Khách hàng chỉ xem được lịch sử của mình
CREATE POLICY "Customers can view their own usage history"
ON public.magiamgia_sudung
FOR SELECT
TO authenticated
USING (
    makhachhang = (auth.jwt() ->> 'user_id')::INTEGER
);

COMMENT ON TABLE public.magiamgia_sudung IS 'Lưu lịch sử sử dụng mã giảm giá của khách hàng';
COMMENT ON COLUMN public.magiamgia_sudung.sotiengiamgia IS 'Số tiền giảm giá thực tế áp dụng cho đơn hàng này';
