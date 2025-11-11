-- Migration: add manhanvien column to noidungchat if missing
-- Safe to run multiple times (checks existence)
-- 1. Add column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='noidungchat' AND column_name='manhanvien'
    ) THEN
        ALTER TABLE noidungchat ADD COLUMN manhanvien INTEGER NULL;
    END IF;
END$$;

-- 2. Backfill from chatbox.manhanvien for messages currently NULL
UPDATE noidungchat m
SET manhanvien = c.manhanvien
FROM chatbox c
WHERE m.machatbox = c.machatbox AND m.manhanvien IS NULL AND c.manhanvien IS NOT NULL;

-- 3. Create foreign key if not exists (requires column present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type='FOREIGN KEY'
          AND table_name='noidungchat'
          AND constraint_name='noidungchat_manhanvien_fkey'
    ) THEN
        ALTER TABLE noidungchat
        ADD CONSTRAINT noidungchat_manhanvien_fkey FOREIGN KEY (manhanvien)
          REFERENCES taikhoannhanvien(manhanvien) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END$$;

-- 4. Optional index for faster staff-based queries
CREATE INDEX IF NOT EXISTS idx_noidungchat_manhanvien ON noidungchat(manhanvien);

-- 5. (Optional) Verify counts
-- SELECT COUNT(*) AS total, COUNT(manhanvien) AS with_staff FROM noidungchat;
