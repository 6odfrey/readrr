-- =====================================================
-- Readrr Phase 1 Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable PostGIS extension for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),  -- PostGIS geography type
  city TEXT,
  bio TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  total_swaps INTEGER DEFAULT 0 CHECK (total_swaps >= 0),
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'cancelled')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_status);

-- Add comment for documentation
COMMENT ON TABLE public.users IS 'User profiles and account information';

-- Step 3: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create user profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1)  -- Default username from email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public user info viewable by authenticated users" ON public.users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Anyone (authenticated) can view public user info
CREATE POLICY "Public user info viewable by authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Step 6: Create posts table (needed for onboarding)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('social', 'swap')),

  -- Book info (both types)
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  cover_image_url TEXT,

  -- Social post fields (nullable if swap post)
  social_type TEXT CHECK (social_type IN ('currently_reading', 'just_finished', 'recommendation')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 120),

  -- Swap post fields (nullable if social post)
  photo_url TEXT,
  condition TEXT CHECK (condition IS NULL OR condition IN ('new', 'like_new', 'good', 'acceptable')),
  description TEXT,
  location GEOGRAPHY(POINT, 4326),
  is_available BOOLEAN DEFAULT TRUE,
  preferred_genres TEXT[],
  preferred_authors TEXT[],
  open_to_any BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts USING GIST(location) WHERE post_type = 'swap';
CREATE INDEX IF NOT EXISTS idx_posts_available ON public.posts(is_available) WHERE post_type = 'swap';
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

-- Apply updated_at trigger to posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view social posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view swap posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- Policy: Anyone can view all social posts
CREATE POLICY "Anyone can view social posts"
ON public.posts
FOR SELECT
TO authenticated
USING (post_type = 'social');

-- Policy: Anyone can view swap posts (will add location filter in Phase 2)
CREATE POLICY "Anyone can view swap posts"
ON public.posts
FOR SELECT
TO authenticated
USING (post_type = 'swap');

-- Policy: Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 7: Helper functions
-- Function to calculate distance between two points in miles
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 FLOAT,
  lon1 FLOAT,
  lat2 FLOAT,
  lon2 FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(
    ST_MakePoint(lon1, lat1)::geography,
    ST_MakePoint(lon2, lat2)::geography
  ) / 1609.34;  -- Convert meters to miles
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find users within radius
CREATE OR REPLACE FUNCTION public.get_nearby_users(
  user_lat FLOAT,
  user_lon FLOAT,
  radius_miles FLOAT DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  distance_miles FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    ST_Distance(
      u.location::geography,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) / 1609.34 AS distance_miles
  FROM public.users u
  WHERE u.location IS NOT NULL
    AND ST_DWithin(
      u.location::geography,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check triggers:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check PostGIS:
-- SELECT PostGIS_Version();
