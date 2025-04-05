-- Complete Database Setup for Motifs.AI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Ensure pgcrypto is enabled for gen_random_uuid()

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS patterns;
DROP TABLE IF EXISTS albums;

-- Create albums table
CREATE TABLE albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  preview_image text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create patterns table
CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  style text,
  image_url text NOT NULL,
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Create policies for albums table
CREATE POLICY "Users can view their own albums"
  ON albums FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own albums"
  ON albums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums"
  ON albums FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums"
  ON albums FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for patterns table
CREATE POLICY "Users can view their own patterns and public patterns"
  ON patterns FOR SELECT
  USING (auth.uid() = user_id OR (NOT is_private AND album_id IS NOT NULL));

CREATE POLICY "Users can create patterns"
  ON patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns"
  ON patterns FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_patterns_album_id ON patterns(album_id);
CREATE INDEX idx_albums_category ON albums(category);

-- Grant necessary permissions
GRANT ALL ON albums TO authenticated;
GRANT ALL ON patterns TO authenticated;
