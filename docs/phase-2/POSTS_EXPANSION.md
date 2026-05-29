# Phase 2: Database Expansion

**For:** Claude Code  
**Purpose:** Expand posts table for swaps, add likes/comments tables

---

## 📋 What's Being Added

### **Expand posts table:**
- Swap-specific fields (condition, genre, swap_type, availability)
- Image URL for swap posts
- Location data for nearby filtering

### **New tables:**
- likes (user likes posts)
- comments (user comments on posts)

### **New storage:**
- post-images bucket (max 5MB per image)

---

## 🗄️ SQL Migrations

Run these in Supabase SQL Editor:

### **1. Expand posts table**

```sql
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
```

---

### **2. Create likes table**

```sql
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
```

---

### **3. Create comments table**

```sql
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
```

---

### **4. Create post-images storage bucket**

```sql
-- Create post-images bucket (5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-images', 'post-images', true, 5242880) -- 5MB
ON CONFLICT (id) DO NOTHING;
```

---

### **5. Storage policies for post-images**

```sql
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
```

---

### **6. Helper functions (optional but useful)**

```sql
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
```

---

## ✅ Verification Queries

After running migrations, verify with these queries:

```sql
-- Check posts table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Should include: post_type, image_url, condition, genre, swap_type, availability, location

-- Check likes table exists
SELECT * FROM public.likes LIMIT 0;

-- Check comments table exists
SELECT * FROM public.comments LIMIT 0;

-- Check post-images bucket exists
SELECT * FROM storage.buckets WHERE name = 'post-images';

-- Check storage policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%post%';

-- Test helper functions
SELECT get_like_count('00000000-0000-0000-0000-000000000000');
SELECT get_comment_count('00000000-0000-0000-0000-000000000000');
```

---

## 📊 Updated Schema Overview

### **posts table (complete):**
```
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users
isbn                TEXT
title               TEXT NOT NULL
author              TEXT
cover_url           TEXT
post_type           TEXT (social, swap)          ← NEW
image_url           TEXT                         ← NEW
condition           TEXT (new, like_new, ...)    ← NEW
genre               TEXT                         ← NEW
swap_type           TEXT (trade, borrow, gift)   ← NEW
availability        TEXT (available, pending)    ← NEW
location            GEOGRAPHY(POINT)             ← NEW
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### **likes table:**
```
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users
post_id     UUID REFERENCES posts
created_at  TIMESTAMPTZ
UNIQUE(user_id, post_id)
```

### **comments table:**
```
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users
post_id     UUID REFERENCES posts
content     TEXT (max 500 chars)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

---

## 🎯 TypeScript Types

Update your models:

**src/models/Post.ts:**
```typescript
export type PostType = 'social' | 'swap';
export type Condition = 'new' | 'like_new' | 'good' | 'acceptable' | 'poor';
export type SwapType = 'trade' | 'borrow' | 'gift';
export type Availability = 'available' | 'pending' | 'swapped';

export interface Post {
  id: string;
  user_id: string;
  isbn?: string;
  title: string;
  author?: string;
  cover_url?: string;
  post_type: PostType;
  image_url?: string;
  condition?: Condition;
  genre?: string;
  swap_type?: SwapType;
  availability?: Availability;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  created_at: string;
  updated_at: string;
  
  // Joined data (from queries)
  user?: {
    username: string;
    avatar_url?: string;
  };
  like_count?: number;
  comment_count?: number;
  has_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user?: {
    username: string;
    avatar_url?: string;
  };
}
```

---

## 🐛 Troubleshooting

**Error: column "post_type" already exists**
- This is fine, it means you already ran part of the migration
- The `ADD COLUMN IF NOT EXISTS` prevents errors

**Error: relation "likes" already exists**
- Use `CREATE TABLE IF NOT EXISTS`
- Safe to re-run

**Error: bucket "post-images" already exists**
- Use `ON CONFLICT (id) DO NOTHING`
- Safe to re-run

**Error: policy already exists**
- Drop old policy first: `DROP POLICY IF EXISTS "policy_name" ON table_name;`
- Then create new one

---

## ✅ Checklist

- [ ] Ran SQL to expand posts table
- [ ] Created likes table
- [ ] Created comments table
- [ ] Created post-images bucket (5MB limit)
- [ ] Created storage policies
- [ ] Created helper functions
- [ ] Verified all tables exist
- [ ] Verified storage bucket exists
- [ ] Updated TypeScript types
- [ ] Can query new columns

---

**Database ready for Phase 2! Continue to BARCODE_COMPONENT.md** ✅
