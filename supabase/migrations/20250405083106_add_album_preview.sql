-- Add preview_image column to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS preview_image text; 