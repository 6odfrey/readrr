-- =====================================================
-- Readrr Phase 1: Avatar Storage & Username Constraint
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- =====================================================

-- Step 1: Add username format constraint (if not exists)
-- Username must be lowercase, 3-20 chars, only letters/numbers/underscores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_format'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');
  END IF;
END $$;

-- Step 2: Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728)  -- 3MB limit
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728;

-- Step 3: Storage policies for avatars

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatar (folder must match user id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check bucket exists:
-- SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Check policies:
-- SELECT policyname FROM pg_policies WHERE tablename = 'objects';
