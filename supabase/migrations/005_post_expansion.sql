-- step 1: Expand posts table
-- Add swap-specific columns to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'social' CHECK (post_type IN ('social', 'swap')),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor')),
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS swap_type TEXT CHECK (swap_type IN ('trade', 'borrow', 'gift')),
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'pending', 'swapped')),
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_posts_availability ON public.posts(availability) WHERE post_type = 'swap';
CREATE INDEX IF NOT EXISTS idx_posts_genre ON public.posts(genre) WHERE post_type = 'swap';

-- Add comment to explain columns
COMMENT ON COLUMN public.posts.post_type IS 'social = sharing what reading, swap = book available to swap';
COMMENT ON COLUMN public.posts.condition IS 'Physical condition of book (swap posts only)';
COMMENT ON COLUMN public.posts.swap_type IS 'trade = swap for another book, borrow = lend temporarily, gift = give away';
COMMENT ON COLUMN public.posts.availability IS 'available = can be swapped, pending = swap in progress, swapped = already swapped';

-- step 2: Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: user can only like a post once
  UNIQUE(user_id, post_id)
);

-- Indexes
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);

-- RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT
USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- step 3: Create Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Updated at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone"
ON public.comments FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- step 4: Create post-images storage bucket
-- Create post-images bucket (5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-images', 'post-images', true, 5242880) -- 5MB
ON CONFLICT (id) DO NOTHING;

-- step 5: Storage policies for post-images
-- Public read
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- Users can update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- step 6: Helper functions (optional but useful)
-- Function to get like count for a post
CREATE OR REPLACE FUNCTION get_like_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.likes WHERE post_id = post_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to get comment count for a post
CREATE OR REPLACE FUNCTION get_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.comments WHERE post_id = post_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if user liked a post
CREATE OR REPLACE FUNCTION user_has_liked(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.likes 
    WHERE post_id = post_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE;

-- Add the missing cover_url column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Verify it worked
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'cover_url';
