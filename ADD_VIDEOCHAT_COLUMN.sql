-- Migration: Add videochat column to noidungchat table
-- Date: 2025-11-23
-- Purpose: Support video attachments in chat messages

-- Add videochat column to store video URLs
ALTER TABLE noidungchat
ADD COLUMN IF NOT EXISTS videochat VARCHAR(500);

-- Add comment to document the column
COMMENT ON COLUMN noidungchat.videochat IS 'URL of video attachment in chat message (optional)';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'noidungchat' AND column_name = 'videochat';
