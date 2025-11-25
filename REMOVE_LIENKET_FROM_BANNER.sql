-- Migration: remove column lienket from banner table
-- Review dependencies before running: server code updated to drop references.
-- If using Supabase, run in SQL editor.
-- Backup data if needed: SELECT mabanner, lienket FROM banner WHERE lienket IS NOT NULL;

ALTER TABLE banner DROP COLUMN IF EXISTS lienket;

-- Optional: if any indexes existed on lienket, drop them (example)
-- DROP INDEX IF EXISTS banner_lienket_idx;

-- Verify
-- SELECT * FROM banner LIMIT 5;