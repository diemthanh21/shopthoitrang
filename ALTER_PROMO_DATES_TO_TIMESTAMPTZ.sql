-- Upgrade promo dates to timestamp (retain existing dates but allow storing hours)
ALTER TABLE IF EXISTS khuyenmai
  ALTER COLUMN ngaybatdau TYPE timestamptz USING ngaybatdau::timestamptz,
  ALTER COLUMN ngayketthuc TYPE timestamptz USING ngayketthuc::timestamptz;
