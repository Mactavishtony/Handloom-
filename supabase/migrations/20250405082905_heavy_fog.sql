/*
  # Handloom Patterns Database Schema

  1. New Tables
    - `albums`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `patterns`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `style` (text)
      - `image_url` (text)
      - `album_id` (uuid, references albums)
      - `user_id` (uuid, references auth.users)
      - `is_private` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Create albums table
CREATE TABLE albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Policies for albums
CREATE POLICY "Users can view their own albums" 
  ON albums FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own albums" 
  ON albums FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" 
  ON albums FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" 
  ON albums FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create patterns table
CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  style text,
  image_url text NOT NULL,
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for patterns
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Policies for patterns
CREATE POLICY "Users can view their own patterns and public patterns" 
  ON patterns FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR (NOT is_private AND album_id IS NOT NULL)
  );

CREATE POLICY "Users can create patterns" 
  ON patterns FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" 
  ON patterns FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns" 
  ON patterns FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);