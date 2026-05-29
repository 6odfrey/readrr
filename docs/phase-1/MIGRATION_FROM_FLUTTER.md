# Phase 1: Migration from Existing Supabase Setup

**Purpose:** Update your existing Supabase setup for React Native with new sign-up flow

---

## ✅ What You Already Have

From your Flutter attempt, you should have:
- ✅ Supabase project created
- ✅ PostGIS extension enabled
- ✅ Basic users table
- ✅ Basic posts table
- ✅ Some RLS policies

---

## 🔄 What Needs to Change

### **1. Users Table Updates**

**ADD these columns:**

```sql
-- Add username column (new requirement)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add constraint for username format
ALTER TABLE public.users
ADD CONSTRAINT username_format CHECK (
  username ~ '^[a-z0-9_]{3,20}$'
);

-- Create index on username
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Modify avatar_url if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make email unique if not already
ALTER TABLE public.users 
ADD CONSTRAINT users_email_unique UNIQUE (email);
```

**REMOVE these columns** (if they exist from Flutter version):

```sql
-- Remove 'name' field if it exists (we're using username instead)
ALTER TABLE public.users DROP COLUMN IF EXISTS name;

-- Remove 'display_name' if it exists
ALTER TABLE public.users DROP COLUMN IF EXISTS display_name;
```

---

### **2. Storage Bucket for Avatars**

**Check if you have 'avatars' bucket:**

```sql
-- Check existing buckets
SELECT * FROM storage.buckets;
```

**If avatars bucket doesn't exist, create it:**

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728) -- 3MB limit
ON CONFLICT (id) DO NOTHING;
```

**Update/Create storage policies:**

```sql
-- Delete old policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### **3. Users Table - Final Schema Check**

Your users table should look like this:

```sql
-- Verify your users table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Should have:
-- id (uuid, NOT NULL)
-- username (text, UNIQUE, NOT NULL) ← NEW/UPDATED
-- email (text, UNIQUE, NOT NULL)
-- avatar_url (text, nullable)
-- city (text, nullable)
-- bio (text, nullable)
-- location (geography, nullable)
-- avg_rating (numeric)
-- total_swaps (integer)
-- subscription_status (text)
-- stripe_customer_id (text, nullable)
-- fcm_token (text, nullable)
-- created_at (timestamptz)
-- updated_at (timestamptz)
```

---

### **4. Posts Table - Verify Minimal Schema**

For Phase 1, posts table just needs basics:

```sql
-- Verify posts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts';

-- Phase 1 minimal posts schema (you'll expand in Phase 2):
-- id, user_id, isbn, title, author, cover_url, post_type, created_at
```

**If posts table is missing columns, add them:**

```sql
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'social' CHECK (post_type IN ('social', 'swap'));
```

---

## 🆕 React Native Specific Setup

### **1. Create Expo Project**

```bash
# Create new Expo project
npx create-expo-app readrr --template blank-typescript
cd readrr

# Install core dependencies
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill expo-secure-store
npx expo install expo-camera expo-barcode-scanner expo-image-picker
npx expo install expo-image-manipulator

# Install state management
npm install zustand

# Install NativeWind (Tailwind)
npm install nativewind
npm install --save-dev tailwindcss

# Initialize Tailwind
npx tailwindcss init
```

### **2. Configure NativeWind**

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**babel.config.js:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"],
  };
};
```

### **3. Environment Variables**

**Create .env file:**
```env
SUPABASE_URL=your_existing_supabase_url
SUPABASE_ANON_KEY=your_existing_anon_key
GOOGLE_BOOKS_API_KEY=your_api_key_if_you_have_one
```

**Add to .gitignore:**
```
.env
.env.local
node_modules/
```

### **4. Supabase Client Setup**

**src/config/supabase.ts:**
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## ✅ Migration Checklist

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check username column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'username';

-- 2. Check avatars bucket exists
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- 3. Check storage policies exist
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- 4. Verify users table structure
\d users

-- 5. Test username uniqueness
-- Try inserting duplicate username (should fail)
INSERT INTO users (id, username, email) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'testuser', 'test1@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'testuser', 'test2@test.com');
-- Should fail with unique constraint error

-- Clean up test
DELETE FROM users WHERE email LIKE 'test%@test.com';
```

---

## 🚀 What's Different from Flutter

### **Sign-Up Flow:**
- **Flutter:** Name, email, password
- **React Native:** Email, password → @username, avatar (optional)

### **Users Table:**
- **Flutter:** Had `name` field
- **React Native:** Has `username` field (unique, lowercase, 3-20 chars)

### **Avatar:**
- **Flutter:** Maybe not implemented
- **React Native:** Optional upload (max 3MB), with colored circle default

### **Storage:**
- **Flutter:** Maybe not set up
- **React Native:** avatars bucket required from Phase 1

---

## 📝 Next Steps

1. ✅ Run the SQL migrations above in Supabase dashboard
2. ✅ Verify all changes applied correctly
3. ✅ Create Expo project with commands above
4. ✅ Set up .env with your existing Supabase credentials
5. ✅ Test Supabase connection from React Native
6. ✅ Continue to AUTH.md for authentication implementation

---

## 🐛 Troubleshooting

**If username column already exists but not unique:**
```sql
-- Make it unique
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
```

**If you have existing users without usernames:**
```sql
-- Generate usernames from emails (temporary)
UPDATE users 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;
```

**If avatars bucket has wrong size limit:**
```sql
UPDATE storage.buckets 
SET file_size_limit = 3145728 
WHERE name = 'avatars';
```

---

**Migration complete! Continue to next section.** ✅
