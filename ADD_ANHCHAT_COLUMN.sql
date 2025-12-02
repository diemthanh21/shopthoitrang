-- Migration: Add anhchat column to noidungchat table
-- Date: 2025-11-23
-- Purpose: Support image attachments in chat messages

-- Add anhchat column to store image URLs
ALTER TABLE noidungchat
ADD COLUMN IF NOT EXISTS anhchat VARCHAR(500);

-- Add comment to document the column
COMMENT ON COLUMN noidungchat.anhchat IS 'URL of image attachment in chat message (optional)';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'noidungchat' AND column_name = 'anhchat';
