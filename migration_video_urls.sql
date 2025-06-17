-- Migration to change video_url column to videos_url array
-- Run this in your Supabase SQL editor

-- Step 1: Add the new videos_url column as text array
ALTER TABLE project_posts ADD COLUMN videos_url text[];

-- Step 2: Migrate existing video_url data to videos_url array
-- This will convert single video URLs to an array with one element
UPDATE project_posts 
SET videos_url = ARRAY[video_url] 
WHERE video_url IS NOT NULL AND video_url != '';

-- Step 3: Drop the old video_url column
ALTER TABLE project_posts DROP COLUMN video_url;

-- Verify the migration
SELECT id, title, videos_url FROM project_posts LIMIT 5;
