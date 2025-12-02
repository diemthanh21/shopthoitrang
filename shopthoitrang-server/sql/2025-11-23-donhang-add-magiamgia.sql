-- Add magiamgia column to donhang table if not exists
-- This will store comma-separated discount codes used in the order

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'donhang' 
        AND column_name = 'magiamgia'
    ) THEN
        ALTER TABLE public.donhang 
        ADD COLUMN magiamgia TEXT;
        
        COMMENT ON COLUMN public.donhang.magiamgia IS 'Mã giảm giá đã sử dụng (phân cách bằng dấu phẩy nếu nhiều mã)';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donhang_magiamgia ON public.donhang(magiamgia);
