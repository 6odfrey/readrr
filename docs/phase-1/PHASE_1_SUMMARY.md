# Phase 1 Documentation - Complete Package

**Status:** ✅ Ready for Development  
**Last Updated:** January 25, 2026

---

## 📦 What You Have

### **✅ Created Files (6 docs):**

1. **README.md** - Phase 1 overview, timeline, exit criteria
2. **STATUS.md** - Progress tracker (update as you work)
3. **MIGRATION_FROM_FLUTTER.md** - SQL to update your existing Supabase
4. **QUICK_START.md** - Fast setup commands
5. **ARCHITECTURE.md** - Complete database schema, tech stack, file structure
6. **SIGNUP_SPEC.md** - Full 2-step signup code with username + avatar

---

## 🎯 What You Can Build Now

With these 6 files, you can:

### ✅ **Database Setup** (5 min)
- Run SQL from MIGRATION_FROM_FLUTTER.md
- Your Supabase is ready!

### ✅ **Project Setup** (15 min)
- Follow QUICK_START.md commands
- Expo project created with all packages!

### ✅ **Sign-Up Screen** (Copy & Paste)
- Complete code in SIGNUP_SPEC.md
- 2-step flow with username validation
- Avatar upload with default colored circle
- Just copy the code!

### ✅ **Avatar Component** (Copy & Paste)
- Reusable Avatar component
- Shows colored circle with first letter if no photo
- Code ready in SIGNUP_SPEC.md

---

## 📋 What's Missing (Claude Code Will Build)

These screens are simple React Native - you or Claude Code can build them:

### **1. WelcomeScreen** (Simple)
- Logo
- "Get Started" button → SignUp
- "Sign In" button → SignIn

### **2. SignInScreen** (Simple)
- Email input
- Password input
- Sign in button
- Basic Supabase auth call

### **3. FirstPostScreen** (Medium - needs barcode)
- Camera view
- expo-barcode-scanner integration
- Fetch book from Google Books API
- Save to posts table

### **4. ProfileScreen** (Simple)
- Show Avatar component
- Show @username
- Show user's first post
- Sign out button

### **5. Navigation Setup** (Medium - conditional rendering)
- Root navigator checks auth state
- No session → AuthStack (Welcome, SignUp, SignIn)
- Session but no posts → OnboardingStack (FirstPost)
- Session + has posts → MainStack (bottom tabs)

---

## 🤖 How Claude Code Will Help

### **Option A: You ask for specific screens**

```
You: "Claude Code, create WelcomeScreen according to docs/phase-1/ARCHITECTURE.md"

Claude Code: 
- Reads ARCHITECTURE.md for file structure
- Creates src/screens/auth/WelcomeScreen.tsx
- Builds simple landing screen with buttons
```

### **Option B: Claude Code builds everything**

```
You: "Claude Code, build all Phase 1 screens. Follow docs/phase-1/ specifications."

Claude Code:
- Reads all Phase 1 docs
- Creates all missing screens
- Sets up navigation
- You just review and test!
```

---

## 📝 Recommended Approach

### **Step 1: Setup (You do this) - 20 min**
```bash
# 1. Run database migrations
# Copy SQL from MIGRATION_FROM_FLUTTER.md → Supabase SQL Editor

# 2. Create Expo project
# Follow QUICK_START.md commands

# 3. Create .env file
# Add your Supabase credentials
```

### **Step 2: Copy Sign-Up Code (You or Claude) - 10 min**
```bash
# Create folders
mkdir -p src/screens/auth src/components

# Copy SignUpScreen code from SIGNUP_SPEC.md
# Copy Avatar component code from SIGNUP_SPEC.md

# Test sign-up flow works
```

### **Step 3: Claude Code builds rest - 30-60 min**
```
You to Claude Code:
"Build the following screens according to Phase 1 specs:
1. WelcomeScreen (simple landing)
2. SignInScreen (email + password)
3. FirstPostScreen (barcode scanner + Google Books)
4. ProfileScreen (show user info)
5. Navigation setup (conditional auth routing)"

Claude Code will create all files!
```

### **Step 4: Test Everything - 30 min**
- Use Expo Go
- Test sign-up flow
- Test barcode scanner (physical device)
- Test profile display
- Check STATUS.md items

### **Step 5: Done! ✅**
Fill out STATUS.md with all ✅ and proceed to Phase 2!

---

## 🎯 What Each Screen Needs (For Claude Code)

### **WelcomeScreen**
```
- Background (white)
- Logo image (centered)
- App name "Readrr" (large, bold)
- Tagline "Swap books with readers nearby"
- "Get Started" button (primary) → navigate to SignUp
- "Sign In" button (secondary) → navigate to SignIn
```

### **SignInScreen**
```
- Back button
- Title "Sign In"
- Email input
- Password input
- Sign in button
- "Forgot password?" link (can be placeholder for Phase 1)
- On success: Supabase session created, navigation handles redirect
```

### **FirstPostScreen (Barcode Scanner)**
```
- Camera view (full screen)
- expo-barcode-scanner listening for EAN-13 or EAN-8
- On scan: 
  1. Get ISBN from barcode
  2. Fetch book from Google Books API
  3. Show book info (title, author, cover)
  4. "Post This Book" button
  5. Save to posts table
  6. Navigate to main app
- Manual entry option (if barcode doesn't work)
```

### **ProfileScreen**
```
- Avatar component (size 80)
- @username below avatar
- "Member since [date]" text
- Stats: "X books posted"
- Show first post (book card)
- Sign out button at bottom
```

### **Navigation (Root)**
```typescript
// Pseudo-code structure

function RootNavigator() {
  const session = useAuthStore(state => state.session);
  const [hasPosted, setHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has any posts
    if (session) {
      checkUserHasPosts(session.user.id);
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) return <SplashScreen />;
  
  if (!session) return <AuthStack />;
  if (!hasPosted) return <OnboardingStack />;
  return <MainStack />;
}
```

---

## ✅ Phase 1 Complete Checklist

- [ ] Database migrations run in Supabase
- [ ] Expo project created
- [ ] All packages installed
- [ ] .env file configured
- [ ] SignUpScreen created (with 2-step flow)
- [ ] Avatar component created (with default)
- [ ] WelcomeScreen created
- [ ] SignInScreen created
- [ ] FirstPostScreen created (barcode scanner)
- [ ] ProfileScreen created
- [ ] Navigation setup (conditional rendering)
- [ ] Can sign up with @username + avatar
- [ ] Can sign in
- [ ] Must scan book before accessing app
- [ ] Profile shows user info correctly
- [ ] No welcome screen flash on app load
- [ ] Sign out works
- [ ] All features tested on Expo Go

---

## 🚀 Next Steps

**When Phase 1 is 100% complete:**

1. Update STATUS.md - mark all sections ✅
2. Test everything thoroughly
3. Come back and say: **"Phase 1 complete, create Phase 2 docs"**
4. I'll create all Phase 2 documentation
5. Continue building!

---

## 💡 Tips

**For Claude Code:**
- Point it to your project folder
- Reference these docs when asking for help
- It will read the specs and build accordingly

**For Testing:**
- Use physical device for barcode scanner
- Test on both iOS and Android if possible
- Check that navigation doesn't flash screens
- Verify avatar uploads work

**For Debugging:**
- Check Supabase logs if database issues
- Use React Native Debugger
- Check Expo logs for errors

---

**You have everything you need to build Phase 1! Good luck!** 🚀📚
