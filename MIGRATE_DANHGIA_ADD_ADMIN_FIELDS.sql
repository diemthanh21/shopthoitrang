-- Add fields to track admin interaction with ratings
-- Run this migration to add columns for admin review status

ALTER TABLE danhgia 
ADD COLUMN IF NOT EXISTS dadocbyadmin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ngayadmindoc TIMESTAMP,
ADD COLUMN IF NOT EXISTS ngayphanhoitushop TIMESTAMP;

-- Update existing rows with phanhoitushop to mark as read
UPDATE danhgia 
SET dadocbyadmin = TRUE, 
    ngayphanhoitushop = ngaydanhgia
WHERE phanhoitushop IS NOT NULL AND phanhoitushop != '';

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_danhgia_dadocbyadmin ON danhgia(dadocbyadmin);
CREATE INDEX IF NOT EXISTS idx_danhgia_ngaydanhgia ON danhgia(ngaydanhgia DESC);

COMMENT ON COLUMN danhgia.dadocbyadmin IS 'Admin đã đọc đánh giá chưa';
COMMENT ON COLUMN danhgia.ngayadmindoc IS 'Thời điểm admin đọc lần đầu';
COMMENT ON COLUMN danhgia.ngayphanhoitushop IS 'Thời điểm shop phản hồi';
