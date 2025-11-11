-- Migration: add ngaygiaohang column to donhang if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='donhang' AND column_name='ngaygiaohang'
    ) THEN
        ALTER TABLE donhang ADD COLUMN ngaygiaohang TIMESTAMP NULL;
    END IF;
END$$;

-- Optional: backfill ngaygiaohang from other logs if available.
-- SELECT COUNT(*) AS total, COUNT(ngaygiaohang) AS with_delivered FROM donhang;
