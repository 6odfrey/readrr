# Phase 1: Architecture Reference

**For:** Claude Code  
**Purpose:** Complete database schema and tech stack for Phase 1

---

## 🗄️ Database Schema (Phase 1)

### **Tables Required for Phase 1:**

#### **1. users**
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  
  -- Core Profile (Phase 1)
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  
  -- Extended Profile (added later)
  city TEXT,
  bio TEXT CHECK (length(bio) <= 500),
  location GEOGRAPHY(POINT),
  
  -- Stats
  avg_rating DECIMAL(2,1) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  total_swaps INTEGER DEFAULT 0,
  
  -- Subscription (Phase 4)
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  fcm_token TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$')
);

-- Indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_location ON public.users USING GIST(location);
```

#### **2. posts (minimal for Phase 1)**
```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Book Info
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  
  -- Post Type (Phase 1: only 'social', Phase 2: add 'swap')
  post_type TEXT DEFAULT 'social' CHECK (post_type IN ('social', 'swap')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
```

---

## 🪣 Storage Buckets

### **avatars**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728); -- 3MB limit
```

**Storage Policies:**
```sql
-- Public read
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- User can upload own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User can update own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User can delete own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔐 Row Level Security (Phase 1)

### **users table:**
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone can read user profiles
CREATE POLICY "User profiles are viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);
```

### **posts table:**
```sql
-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Posts are viewable by everyone"
ON public.posts FOR SELECT
USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own posts
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🏗️ Tech Stack

### **Frontend:**
```
Framework:      React Native + Expo SDK 50+
Language:       TypeScript
Navigation:     @react-navigation/native-stack (native transitions)
Styling:        NativeWind (Tailwind CSS)
State:          Zustand
Camera:         expo-camera, expo-barcode-scanner
Images:         expo-image-picker, expo-image-manipulator
```

### **Backend:**
```
Database:       Supabase (PostgreSQL + PostGIS)
Auth:           Supabase Auth
Storage:        Supabase Storage
Real-time:      Supabase Realtime (Phase 2+)
Functions:      Supabase Edge Functions (Phase 4+)
```

### **External APIs:**
```
Books:          Google Books API (optional key)
Payments:       Stripe (Phase 4)
Notifications:  Expo Notifications (Phase 4)
```

---

## 📦 Package Dependencies

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "typescript": "^5.3.0",
    
    "// Navigation": "",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.0",
    
    "// State": "",
    "zustand": "^4.4.7",
    
    "// Supabase": "",
    "@supabase/supabase-js": "^2.39.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-url-polyfill": "^2.0.0",
    "expo-secure-store": "~12.8.0",
    
    "// Camera & Images": "",
    "expo-camera": "~14.0.0",
    "expo-barcode-scanner": "~12.9.0",
    "expo-image-picker": "~14.7.0",
    "expo-image-manipulator": "~11.8.0",
    "expo-image": "~1.10.0",
    
    "// Styling": "",
    "nativewind": "^2.0.11"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 📁 Project File Structure

```
readrr/
├── .env                              # Environment variables (not committed)
├── .gitignore
├── app.json
├── babel.config.js                   # NativeWind plugin
├── package.json
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json
│
├── docs/                             # Documentation (this folder)
│
├── src/
│   ├── components/
│   │   ├── Avatar.tsx               # Reusable avatar with default
│   │   ├── LoadingSpinner.tsx
│   │   └── Input.tsx
│   │
│   ├── config/
│   │   └── supabase.ts              # Supabase client initialization
│   │
│   ├── models/
│   │   ├── User.ts                  # User type definition
│   │   └── Post.ts                  # Post type definition
│   │
│   ├── navigation/
│   │   ├── index.tsx                # Root navigator with auth logic
│   │   ├── AuthStack.tsx            # Welcome, SignUp, SignIn
│   │   ├── OnboardingStack.tsx      # FirstPost
│   │   └── MainStack.tsx            # Bottom tabs + other screens
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── SignUpScreen.tsx     # 2-step signup
│   │   │   └── SignInScreen.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   └── FirstPostScreen.tsx  # Barcode scanner
│   │   │
│   │   ├── main/
│   │   │   ├── FeedScreen.tsx       # (Phase 2)
│   │   │   ├── SwapsScreen.tsx      # (Phase 2)
│   │   │   └── CreatePostScreen.tsx # (Phase 2)
│   │   │
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── EditProfileScreen.tsx # (Phase 2)
│   │
│   ├── services/
│   │   ├── authService.ts           # Auth helper functions
│   │   ├── storageService.ts        # Image upload helpers
│   │   └── booksService.ts          # Google Books API
│   │
│   ├── store/
│   │   └── authStore.ts             # Zustand auth state
│   │
│   └── utils/
│       ├── imageCompression.ts      # Compress images <3MB
│       ├── validation.ts            # Username, email validation
│       └── colors.ts                # Avatar color generation
│
└── App.tsx                           # Root component, imports navigation
```

---

## 🔑 Environment Variables

**.env file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_BOOKS_API_KEY=optional_if_you_have_one
```

**Usage in code:**
```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
// OR use process.env.SUPABASE_URL with dotenv
```

---

## 🎨 Design Tokens (NativeWind)

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // Blue
        success: '#10B981',    // Green
        warning: '#F59E0B',    // Yellow
        error: '#EF4444',      // Red
      }
    },
  },
  plugins: [],
}
```

---

## 🔄 Data Flow (Phase 1)

### **Sign Up Flow:**
```
1. User enters email + password → Supabase Auth creates account
2. User chooses @username + avatar → Create user profile in users table
3. Upload avatar to storage (optional) → Get public URL
4. Save username + avatar_url to users table
5. Redirect to FirstPost onboarding
```

### **First Post Flow:**
```
1. User scans barcode → Get ISBN
2. Fetch book from Google Books API
3. Create post in posts table with book info
4. Redirect to main app (Feed screen)
```

### **Auth State:**
```
1. App loads → Check Supabase session
2. If no session → Show AuthStack (Welcome/SignUp/SignIn)
3. If session but no posts → Show OnboardingStack (FirstPost)
4. If session + has posts → Show MainStack (Bottom Tabs)
```

---

## ✅ Phase 1 Database Checklist

- [ ] PostGIS extension enabled
- [ ] users table created with username column
- [ ] posts table created (minimal schema)
- [ ] avatars storage bucket created (3MB limit)
- [ ] Storage policies set up
- [ ] RLS enabled on users table
- [ ] RLS enabled on posts table
- [ ] Indexes created
- [ ] Can query from Supabase dashboard

---

**This document provides the complete architecture for Phase 1. Use it as reference when building components and screens.**
