# Phase 1: Foundation

**Duration:** 2-3 weeks  
**Goal:** Authentication, onboarding with barcode scanner, navigation, basic profile

---

## 📋 Overview

Phase 1 establishes the foundation of Readrr:
- User authentication with Supabase
- 2-step sign-up (@username + optional avatar)
- Mandatory first post (barcode scanner)
- Native Stack navigation
- Basic profile screen

By the end of Phase 1, users can:
- ✅ Sign up with @username and avatar
- ✅ Sign in/out
- ✅ Scan a book barcode for first post
- ✅ Navigate between screens smoothly
- ✅ View their profile

---

## 🎯 Exit Criteria

Phase 1 is complete when:

1. ✅ Expo project setup with NativeWind
2. ✅ Supabase connected (database + auth + storage)
3. ✅ Users table with PostGIS extension
4. ✅ Sign-up flow (2 steps: credentials → profile)
5. ✅ Username validation (lowercase, unique, 3-20 chars)
6. ✅ Avatar upload (optional, max 3MB, with default colored circle)
7. ✅ Sign-in working
8. ✅ Auth persistence (no welcome screen flash)
9. ✅ Barcode scanner working
10. ✅ First post saves to database
11. ✅ Native Stack navigation with bottom tabs
12. ✅ Profile screen displays user info
13. ✅ Sign out working
14. ✅ All tests passing (see TESTING.md)

---

## 📂 Sections

### **1.1 Project Setup** (4-6 hours)
**File:** `SETUP.md`

- Install Expo CLI
- Create project with TypeScript
- Install dependencies (React Navigation, NativeWind, Supabase, etc.)
- Configure NativeWind (Tailwind)
- Set up folder structure
- Create .env file

**Exit:** `npx expo start` works, can see blank screen in Expo Go

---

### **1.2 Database Schema** (2-3 hours)
**File:** `DATABASE.md`

- Create Supabase project
- Enable PostGIS extension
- Create users table
- Create posts table (minimal version)
- Set up Row Level Security (RLS)
- Create helper functions
- Create avatars storage bucket

**Exit:** Tables created, RLS working, can query from Supabase dashboard

---

### **1.3 Authentication** (6-8 hours)
**File:** `AUTH.md`

- Set up Supabase client
- Create auth store (Zustand)
- Build Welcome screen
- Build Sign In screen
- Implement auth state management
- Handle auth persistence

**Exit:** Users can sign in, session persists on app restart

---

### **1.4 Sign-Up Flow** (6-8 hours)
**File:** `SIGNUP.md`

- Build 2-step sign-up screen
- Step 1: Email + Password
- Step 2: @username + Avatar
- Username validation (realtime)
- Avatar picker with compression
- Default avatar component (colored circle)
- Create user profile after signup

**Exit:** Users can create account with @username and optional avatar

---

### **1.5 Mandatory Onboarding** (6-8 hours)
**File:** `ONBOARDING.md`

- Build FirstPost screen
- Integrate expo-barcode-scanner
- Request camera permissions
- Scan ISBN barcode
- Fetch book from Google Books API
- Save first post to database
- Redirect to main app

**Exit:** Users must post a book before accessing app

---

### **1.6 Navigation** (4-6 hours)
**File:** `NAVIGATION.md`

- Set up React Navigation
- Create Native Stack Navigator
- Build conditional navigation (auth state based)
- Create Bottom Tab Navigator
- Set up screen structure
- Handle deep linking

**Exit:** Smooth navigation, no screen flashes, bottom tabs working

---

### **1.7 Profile Screen** (3-4 hours)
**File:** `PROFILE.md`

- Build ProfileScreen
- Display user info (avatar, username, stats)
- Show user's first post
- Add sign out button
- Handle avatar with default fallback

**Exit:** Profile displays correctly, sign out works

---

### **1.8 Testing** (2-3 hours)
**File:** `TESTING.md`

- Test auth flow
- Test sign-up with avatar
- Test barcode scanner
- Test navigation
- Test profile
- Fix any bugs

**Exit:** All features working on Expo Go

---

## 📊 Time Breakdown

| Section | Time | Complexity |
|---------|------|------------|
| 1.1 Setup | 4-6h | Easy |
| 1.2 Database | 2-3h | Easy |
| 1.3 Auth | 6-8h | Medium |
| 1.4 Sign-Up | 6-8h | Medium |
| 1.5 Onboarding | 6-8h | Medium |
| 1.6 Navigation | 4-6h | Easy |
| 1.7 Profile | 3-4h | Easy |
| 1.8 Testing | 2-3h | Easy |
| **Total** | **33-46 hours** | **2-3 weeks** |

---

## 🗂️ File Structure After Phase 1

```
readrr/
├── .env                           # Environment variables
├── .gitignore
├── app.json
├── babel.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
│
├── src/
│   ├── components/
│   │   ├── Avatar.tsx            # Reusable avatar component
│   │   └── LoadingSpinner.tsx
│   │
│   ├── config/
│   │   └── supabase.ts           # Supabase client
│   │
│   ├── models/
│   │   ├── User.ts               # User type
│   │   └── Post.ts               # Post type
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Root navigation logic
│   │   ├── AuthStack.tsx         # Auth screens
│   │   ├── OnboardingStack.tsx   # Onboarding screens
│   │   └── MainStack.tsx         # Main app (tabs)
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   └── SignInScreen.tsx
│   │   ├── onboarding/
│   │   │   └── FirstPostScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   │
│   ├── services/
│   │   ├── authService.ts        # Auth helpers
│   │   ├── storageService.ts     # Image upload
│   │   └── booksService.ts       # Google Books API
│   │
│   ├── store/
│   │   └── authStore.ts          # Zustand auth state
│   │
│   └── utils/
│       ├── imageCompression.ts
│       └── validation.ts
│
└── App.tsx                        # Root component
```

---

## 🔑 Key Decisions

### **Why Native Stack Navigator?**
- Native transitions (UINavigationController on iOS, Fragment on Android)
- No render issues like regular Stack
- Smoother performance
- 60fps animations

### **Why Zustand for State?**
- Simpler than Redux
- Less boilerplate than Context API
- Perfect for auth state
- Easy to debug

### **Why 2-Step Sign-Up?**
- Less overwhelming
- Users see progress (Step 1 of 2)
- Can validate email/password before asking for profile
- Better UX

### **Why Mandatory First Post?**
- Ensures quality users (not just browsers)
- Gets users engaged immediately
- Creates content for community
- Validates book interest

---

## 🚨 Common Pitfalls

### **1. Welcome Screen Flash**
**Problem:** Users see welcome screen briefly before redirecting to main app  
**Solution:** Use loading state while checking auth, only render stacks after loaded

### **2. Camera Permissions**
**Problem:** expo-barcode-scanner not working  
**Solution:** Request permissions explicitly, handle denied case, test on physical device

### **3. Username Already Taken**
**Problem:** User gets error after filling everything  
**Solution:** Check username availability in real-time as they type

### **4. Image Upload Fails**
**Problem:** Avatar upload timing out  
**Solution:** Compress images before upload, show progress indicator, handle errors

### **5. Navigation State Lost**
**Problem:** App forgets where user was after restart  
**Solution:** Persist navigation state with AsyncStorage

---

## 📝 Prerequisites

Before starting Phase 1:

- ✅ Node.js 18+ installed
- ✅ npm or yarn installed
- ✅ Expo Go app on phone (iOS or Android)
- ✅ Supabase account created
- ✅ Code editor (VS Code recommended)
- ✅ Basic React/TypeScript knowledge

---

## 🎯 Next Steps

1. Read `SETUP.md` 
2. Follow step-by-step to create project
3. Update `STATUS.md` as you complete each section
4. When Phase 1 is 100% complete, fill out `../checkpoints/CHECKPOINT_PHASE_1.md`
5. Proceed to Phase 2!

---

## 💡 Tips

- **Test frequently** - Use Expo Go to see changes instantly
- **Commit often** - Git commit after each section
- **Use Claude Code** - Point it to these docs, it will help you build
- **Don't skip testing** - TESTING.md checklist is critical
- **Physical device** - Barcode scanner needs real device, won't work well in simulator

---

**Let's build Phase 1!** 🚀
