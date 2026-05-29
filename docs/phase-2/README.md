# Phase 2: Core Features

**Duration:** 4-5 weeks  
**Goal:** Expand posts, create dual-tab feed, social engagement, profiles

---

## 📋 Overview

Phase 2 transforms Readrr from a simple onboarding app into a fully functional social book-swapping platform:
- Expand posts table for swap-specific fields
- Dual-tab feed (Feed + Swaps)
- Create social posts and swap posts
- Like and comment on posts
- Real-time updates with Supabase
- View other users' profiles
- Upload images for swap posts

By the end of Phase 2, users can:
- ✅ Browse social posts and available swaps in separate tabs
- ✅ Create social posts (share what they're reading)
- ✅ Create swap posts (books available to swap)
- ✅ Upload photos of books
- ✅ Like and comment on posts
- ✅ See real-time updates when others engage
- ✅ View other users' profiles
- ✅ Filter swaps by location (nearby)

---

## 🎯 Exit Criteria

Phase 2 is complete when:

1. ✅ Posts table expanded with swap fields
2. ✅ Likes and comments tables created
3. ✅ Post images storage bucket created
4. ✅ Barcode scanner extracted to reusable component
5. ✅ Image picker working for swap posts (max 5MB)
6. ✅ Create post screen (choose social vs swap)
7. ✅ Social post creation working
8. ✅ Swap post creation working (barcode + image + details)
9. ✅ Dual-tab feed (Feed + Swaps tabs)
10. ✅ Feed shows posts with infinite scroll
11. ✅ Can like/unlike posts
12. ✅ Can comment on posts
13. ✅ Real-time updates working (new likes/comments appear instantly)
14. ✅ Book detail page shows full swap post
15. ✅ Can view other users' profiles
16. ✅ Nearby swaps filtered by location
17. ✅ All tests passing (see TESTING.md)

---

## 📂 Sections

### **2.1 Database Expansion** (2-3 hours)
**File:** `POSTS_EXPANSION.md`

- Expand posts table with swap fields
- Create likes table
- Create comments table
- Create post-images storage bucket
- Set up RLS policies
- Add indexes

**Exit:** Tables created, can query from Supabase

---

### **2.2 Reusable Barcode Component** (3-4 hours)
**File:** `BARCODE_COMPONENT.md`

- Extract barcode scanner from FirstPostScreen
- Create reusable `<BarcodeScanner>` component
- Integrate Google Books API service
- Handle errors and manual entry

**Exit:** Barcode scanner works as reusable component

---

### **2.3 Image Upload for Posts** (4-5 hours)
**File:** `IMAGES_SPEC.md`

- Set up expo-image-picker
- Image compression (max 5MB for posts vs 3MB for avatars)
- Upload to post-images bucket
- Show preview before posting

**Exit:** Can pick and upload images for posts

---

### **2.4 Post Creation Flow** (8-10 hours)
**File:** `POST_CREATION_SPEC.md`

- Create post type selection screen
- Social post creation screen
- Swap post creation screen (barcode + image + details)
- Form validation
- Save to database

**Exit:** Can create both social and swap posts

---

### **2.5 Dual-Tab Feed** (8-10 hours)
**File:** `FEED_SPEC.md`

- Create Feed tab (social posts)
- Create Swaps tab (available books, nearby filter)
- Infinite scroll with FlatList
- Pull-to-refresh
- Empty states
- Post cards with like/comment counts

**Exit:** Feed works with both tabs, shows all posts

---

### **2.6 Social Engagement** (10-12 hours)
**File:** `ENGAGEMENT_SPEC.md`

- Like/unlike posts
- Comment on posts
- Real-time updates with Supabase Realtime
- Optimistic UI updates
- Comment list with avatars

**Exit:** Can like/comment, see updates in real-time

---

### **2.7 Book Detail Page** (4-5 hours)
**File:** `BOOK_DETAIL_SPEC.md`

- Full swap post details
- Book info, condition, genre
- Owner's profile link
- Map showing approximate location
- "Request Swap" button (Phase 3)

**Exit:** Book detail shows all info correctly

---

### **2.8 User Profiles** (4-5 hours)
**File:** `PROFILES_SPEC.md`

- View other users' profiles
- Show their posts
- Show stats (books posted, swaps completed, rating)
- Edit own profile (city, bio)

**Exit:** Can view profiles, edit own profile

---

### **2.9 Testing** (4-6 hours)
**File:** `TESTING.md`

- Test post creation (both types)
- Test feed scrolling
- Test likes/comments
- Test real-time updates
- Test profiles
- Fix any bugs

**Exit:** All features working smoothly

---

## 📊 Time Breakdown

| Section | Time | Complexity |
|---------|------|------------|
| 2.1 Database | 2-3h | Easy |
| 2.2 Barcode Component | 3-4h | Easy |
| 2.3 Images | 4-5h | Medium |
| 2.4 Post Creation | 8-10h | Medium |
| 2.5 Feed | 8-10h | Medium |
| 2.6 Engagement | 10-12h | Hard |
| 2.7 Book Detail | 4-5h | Easy |
| 2.8 Profiles | 4-5h | Easy |
| 2.9 Testing | 4-6h | Medium |
| **Total** | **47-60 hours** | **4-5 weeks** |

---

## 🗂️ File Structure After Phase 2

```
src/
├── components/
│   ├── Avatar.tsx                      # From Phase 1
│   ├── BarcodeScanner.tsx             # NEW - Reusable
│   ├── PostCard.tsx                   # NEW - Feed item
│   ├── CommentItem.tsx                # NEW - Comment display
│   └── LoadingSpinner.tsx
│
├── screens/
│   ├── auth/ (from Phase 1)
│   ├── onboarding/ (from Phase 1)
│   │
│   ├── main/
│   │   ├── FeedScreen.tsx             # NEW - Dual tabs
│   │   ├── CreatePostScreen.tsx       # NEW - Choose type
│   │   ├── SocialPostScreen.tsx       # NEW - Social creation
│   │   ├── SwapPostScreen.tsx         # NEW - Swap creation
│   │   └── BookDetailScreen.tsx       # NEW - Full swap details
│   │
│   └── profile/
│       ├── ProfileScreen.tsx          # From Phase 1
│       ├── EditProfileScreen.tsx      # NEW - Edit city/bio
│       └── OtherUserProfileScreen.tsx # NEW - View others
│
├── services/
│   ├── authService.ts
│   ├── storageService.ts              # Expand for post images
│   ├── booksService.ts                # From Phase 1
│   ├── postsService.ts                # NEW - CRUD posts
│   └── engagementService.ts           # NEW - Likes/comments
│
└── store/
    ├── authStore.ts
    └── postsStore.ts                  # NEW - Posts state
```

---

## 🔑 Key Decisions

### **Why Dual Tabs?**
- Separates browsing (social feed) from shopping (available swaps)
- Users have different intent in each tab
- Cleaner UX than mixed feed

### **Why Real-time Updates?**
- Social engagement feels alive
- Users see likes/comments appear instantly
- Competitive with other social apps

### **Why Separate Social vs Swap Posts?**
- Different required fields
- Different user intent
- Easier to filter and display

### **Why 5MB for Post Images vs 3MB for Avatars?**
- Post images need detail (book condition visible)
- Avatars are small, don't need high res
- Still reasonable for mobile data

---

## 🚨 Common Pitfalls

### **1. FlatList Performance**
**Problem:** Feed lags with many posts  
**Solution:** Use `getItemLayout`, `removeClippedSubviews`, limit initial load

### **2. Real-time Updates Overwhelming**
**Problem:** Too many websocket connections  
**Solution:** Only subscribe when screen is focused, unsubscribe on blur

### **3. Image Upload Timeouts**
**Problem:** Large images take too long  
**Solution:** Always compress before upload, show progress bar

### **4. Optimistic UI Out of Sync**
**Problem:** Like button shows wrong state after network error  
**Solution:** Revert on error, show error message

### **5. Location Privacy**
**Problem:** Showing exact user location  
**Solution:** Only show city/neighborhood, approximate location on map

---

## 📝 Prerequisites

Before starting Phase 2:

- ✅ Phase 1 complete (auth, onboarding, profile working)
- ✅ Barcode scanner working from Phase 1
- ✅ Supabase project set up
- ✅ Comfortable with React Navigation
- ✅ Understand FlatList basics

---

## 🎯 Next Steps

1. Read `POSTS_EXPANSION.md`
2. Run database migrations
3. Follow sections 2.2 through 2.8
4. Update `STATUS.md` as you complete each section
5. When Phase 2 is 100% complete, fill out `../checkpoints/CHECKPOINT_PHASE_2.md`
6. Proceed to Phase 3!

---

## 💡 Tips

- **Start with database** - Get schema right first
- **Test real-time early** - Supabase Realtime can be tricky
- **Use mock data** - Create dummy posts to test feed
- **Optimize images** - Don't skip compression
- **Handle empty states** - New users need guidance

---

**Ready to build the core of Readrr!** 🚀📚
