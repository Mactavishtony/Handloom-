/*
  # Handloom Patterns Database Schema

  1. New Tables
    - `albums`: Store pattern collections
    - `patterns`: Store individual patterns with privacy controls

  2. Security
    - RLS enabled on both tables
    - Policies for authenticated users
*/

-- Check and create albums table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'albums') THEN
    CREATE TABLE albums (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      category text,
      preview_image text,
      user_id uuid NOT NULL,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Enable RLS and create policies for albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can view their own albums'
  ) THEN
    CREATE POLICY "Users can view their own albums" ON albums
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can create their own albums'
  ) THEN
    CREATE POLICY "Users can create their own albums" ON albums
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can update their own albums'
  ) THEN
    CREATE POLICY "Users can update their own albums" ON albums
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can delete their own albums'
  ) THEN
    CREATE POLICY "Users can delete their own albums" ON albums
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check and create patterns table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patterns') THEN
    CREATE TABLE patterns (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      style text,
      image_url text NOT NULL,
      album_id uuid,
      user_id uuid NOT NULL,
      is_private boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Enable RLS and create policies for patterns
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patterns' AND policyname = 'Users can view their own patterns and public patterns'
  ) THEN
    CREATE POLICY "Users can view their own patterns and public patterns" ON patterns
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id OR (NOT is_private AND album_id IS NOT NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patterns' AND policyname = 'Users can create patterns'
  ) THEN
    CREATE POLICY "Users can create patterns" ON patterns
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patterns' AND policyname = 'Users can update their own patterns'
  ) THEN
    CREATE POLICY "Users can update their own patterns" ON patterns
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patterns' AND policyname = 'Users can delete their own patterns'
  ) THEN
    CREATE POLICY "Users can delete their own patterns" ON patterns
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;