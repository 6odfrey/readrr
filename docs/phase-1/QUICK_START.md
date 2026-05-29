# Phase 1 Quick Start Guide

**You already have:** Supabase project from Flutter attempt  
**You need:** React Native implementation with updated sign-up flow

---

## ⚡ Fast Track Setup

### **1. Run Database Migrations (5 minutes)**

```sql
-- In Supabase SQL Editor, run this:

-- Add username column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Ensure avatar_url exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728)
ON CONFLICT (id) DO NOTHING;
```

✅ **Done!** Database ready for React Native.

---

### **2. Create Expo Project (10 minutes)**

```bash
npx create-expo-app readrr --template blank-typescript
cd readrr

# Install everything at once
npx expo install \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  @supabase/supabase-js \
  @react-native-async-storage/async-storage \
  react-native-url-polyfill \
  expo-secure-store \
  expo-camera \
  expo-barcode-scanner \
  expo-image-picker \
  expo-image-manipulator

npm install zustand nativewind
npm install --save-dev tailwindcss
npx tailwindcss init
```

---

### **3. Configure Files (5 minutes)**

**tailwind.config.js:**
```js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**babel.config.js:**
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"],
  };
};
```

**.env:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

**.gitignore:** (add these lines)
```
.env
.env.local
```

---

### **4. Create Folder Structure (2 minutes)**

```bash
mkdir -p src/{components,config,models,navigation,screens/{auth,onboarding,profile},services,store,utils}
```

---

### **5. Key Files to Create**

I'll give you just the **essential starter files** - you can build from here:

#### **src/config/supabase.ts**
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

#### **src/store/authStore.ts**
```typescript
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
}));
```

#### **src/components/Avatar.tsx**
```typescript
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
}

export default function Avatar({ avatarUrl, username, size = 40 }: AvatarProps) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
  const hash = username.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colorClass = colors[Math.abs(hash) % colors.length];

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} className="rounded-full" />;
  }

  return (
    <View className={`${colorClass} rounded-full items-center justify-center`} style={{ width: size, height: size }}>
      <Text className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
```

---

## 🎯 What You Build Next

Now create these screens (I'll give you the code when you're ready):

1. **Welcome Screen** - Simple landing with "Get Started" and "Sign In" buttons
2. **Sign Up Screen** - 2 steps (email/password → username/avatar)
3. **Sign In Screen** - Email + password
4. **First Post Screen** - Barcode scanner
5. **Profile Screen** - Show user info

**Want me to create these screen files for you? Just ask:**
- "Create WelcomeScreen"
- "Create SignUpScreen with 2-step flow"
- "Create FirstPostScreen with barcode"
- etc.

---

## ✅ Test Your Setup

```bash
# Start Expo
npx expo start

# Scan QR code with Expo Go

# Should see blank screen (no errors)
# Check terminal - no red errors
```

**If working:** ✅ Ready to build screens!  
**If errors:** Check .env file, Supabase credentials, package installations

---

## 📋 Phase 1 Checklist

- [ ] Database migrations run
- [ ] Expo project created
- [ ] All packages installed
- [ ] tailwind.config.js configured
- [ ] .env file created with Supabase keys
- [ ] Folder structure created
- [ ] Can run `npx expo start` successfully
- [ ] Ready to build screens!

---

**Next:** Ask me to create specific screen files as you need them! 🚀

