-- =====================================================
-- READRR — Combined setup SQL
-- Paste the entire contents of this file into
-- Supabase SQL Editor and click Run
-- =====================================================

-- Step 1: Enable PostGIS extension for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  city TEXT,
  bio TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  total_swaps INTEGER DEFAULT 0 CHECK (total_swaps >= 0),
  fcm_token TEXT,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'cancelled')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_location ON public.users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Step 3: updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Remove auto-profile trigger (app handles profile creation manually)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 5: RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public user info viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Public user info viewable by authenticated users" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Username format constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'username_format') THEN
    ALTER TABLE public.users ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');
  END IF;
END $$;

-- Step 6: Avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 3145728;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Step 7: Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'social' CHECK (post_type IN ('social', 'swap')),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  cover_image_url TEXT,
  image_url TEXT,
  social_type TEXT CHECK (social_type IN ('currently_reading', 'just_finished', 'recommendation')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 120),
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor')),
  genre TEXT,
  swap_type TEXT CHECK (swap_type IN ('trade', 'borrow', 'gift')),
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'pending', 'swapped')),
  location GEOGRAPHY(POINT),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_availability ON public.posts(availability) WHERE post_type = 'swap';
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view social posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view swap posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Anyone can view social posts" ON public.posts
  FOR SELECT TO authenticated USING (post_type = 'social');
CREATE POLICY "Anyone can view swap posts" ON public.posts
  FOR SELECT TO authenticated USING (post_type = 'swap');
CREATE POLICY "Users can create own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Step 8: Post images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-images', 'post-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own post images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Step 9: Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Swaps table
CREATE TABLE IF NOT EXISTS public.swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  request_message TEXT CHECK (length(request_message) <= 500),
  requester_confirmed_complete BOOLEAN DEFAULT FALSE,
  owner_confirmed_complete BOOLEAN DEFAULT FALSE,
  meetup_status TEXT CHECK (meetup_status IN ('none', 'proposed', 'agreed')) DEFAULT 'none',
  meetup_proposed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  meetup_venue_name TEXT CHECK (char_length(meetup_venue_name) <= 200),
  meetup_venue_address TEXT CHECK (char_length(meetup_venue_address) <= 400),
  meetup_venue_category TEXT CHECK (meetup_venue_category IN (
    'coffee_shop', 'library', 'bookshop', 'bar', 'book_club', 'community_space', 'other'
  )),
  meetup_proposed_at TIMESTAMPTZ,
  meetup_agreed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (requester_id != owner_id)
);

CREATE INDEX IF NOT EXISTS idx_swaps_requester ON public.swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_swaps_owner ON public.swaps(owner_id);
CREATE INDEX IF NOT EXISTS idx_swaps_post ON public.swaps(post_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON public.swaps(status);

DROP TRIGGER IF EXISTS update_swaps_updated_at ON public.swaps;
CREATE TRIGGER update_swaps_updated_at
BEFORE UPDATE ON public.swaps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own swaps" ON public.swaps;
DROP POLICY IF EXISTS "Authenticated users can create swap requests" ON public.swaps;
DROP POLICY IF EXISTS "Users can update their own swaps" ON public.swaps;
DROP POLICY IF EXISTS "Requesters can delete their swap requests" ON public.swaps;

CREATE POLICY "Users can view their own swaps" ON public.swaps
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create swap requests" ON public.swaps
  FOR INSERT WITH CHECK (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "Users can update their own swaps" ON public.swaps
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = owner_id);
CREATE POLICY "Requesters can delete their swap requests" ON public.swaps
  FOR DELETE USING (auth.uid() = requester_id);

-- Step 12: Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES public.swaps(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_swap ON public.messages(swap_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their swaps" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their swaps" ON public.messages;
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;

CREATE POLICY "Users can view messages in their swaps" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.swaps
      WHERE swaps.id = messages.swap_id
        AND (swaps.requester_id = auth.uid() OR swaps.owner_id = auth.uid())
    )
  );
CREATE POLICY "Users can send messages in their swaps" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.swaps
      WHERE swaps.id = messages.swap_id
        AND (swaps.requester_id = auth.uid() OR swaps.owner_id = auth.uid())
        AND swaps.status = 'accepted'
    )
  );
CREATE POLICY "Users can update message read status" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.swaps
      WHERE swaps.id = messages.swap_id
        AND (swaps.requester_id = auth.uid() OR swaps.owner_id = auth.uid())
    )
  );

-- Step 13: Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON public.follows;
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
DROP POLICY IF EXISTS "follows_delete" ON public.follows;

CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Step 14: Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_rating CHECK (rater_id != rated_id),
  CONSTRAINT one_rating_per_swap_per_rater UNIQUE (swap_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON public.ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_swap_id ON public.ratings(swap_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select" ON public.ratings;
DROP POLICY IF EXISTS "ratings_insert" ON public.ratings;

CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE OR REPLACE FUNCTION update_user_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET avg_rating = (
    SELECT COALESCE(AVG(score), 0) FROM public.ratings WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_avg_rating ON public.ratings;
CREATE TRIGGER trg_update_avg_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_avg_rating();

-- Step 15: total_swaps trigger
CREATE OR REPLACE FUNCTION increment_total_swaps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.users SET total_swaps = total_swaps + 1
    WHERE id IN (NEW.requester_id, NEW.owner_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_total_swaps ON public.swaps;
CREATE TRIGGER trg_increment_total_swaps
  AFTER UPDATE ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION increment_total_swaps();

-- Step 16: Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DONE — all tables, triggers, RLS policies created
-- =====================================================
