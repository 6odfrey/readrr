# Phase 2 Complete Package - Summary

**Status:** ✅ Ready for Development  
**Created:** January 25, 2026

---

## 📦 What You Have (Phase 2 Docs)

### **✅ Created Files:**

1. **README.md** - Phase 2 overview, timeline, exit criteria
2. **STATUS.md** - Progress tracker
3. **POSTS_EXPANSION.md** - SQL to expand database
4. **BARCODE_COMPONENT.md** - Extract scanner to reusable component
5. **IMAGES_SPEC.md** - Image upload for swap posts
6. **POST_CREATION_SPEC.md** - Create social & swap posts
7. **FEED_SPEC.md** - Dual-tab feed (Feed + Swaps)
8. **ENGAGEMENT_SPEC.md** - Likes, comments, real-time
9. **BOOK_DETAIL_SPEC.md** - Full swap post view
10. **PROFILES_SPEC.md** - View/edit profiles
11. **TESTING.md** - Test checklist
12. **PHASE_2_SUMMARY.md** (this file)

---

## 🎯 What You'll Build in Phase 2

### **Database:**
- ✅ Expand posts table (condition, genre, swap_type, etc.)
- ✅ Create likes table
- ✅ Create comments table
- ✅ Create post-images storage bucket (5MB)

### **Screens:**
- ✅ FeedScreen (dual tabs: Feed + Swaps)
- ✅ CreatePostScreen (choose type)
- ✅ SocialPostScreen (share what you're reading)
- ✅ SwapPostScreen (book available to swap)
- ✅ BookDetailScreen (full swap post)
- ✅ EditProfileScreen (add city/bio)
- ✅ OtherUserProfileScreen (view others)

### **Components:**
- ✅ BarcodeScanner (reusable)
- ✅ PostCard (feed item with like/comment)
- ✅ CommentItem (comment display)
- ✅ ImagePicker (for swap posts)

### **Features:**
- ✅ Like/unlike posts
- ✅ Comment on posts
- ✅ Real-time updates (Supabase Realtime)
- ✅ Upload images for swap posts
- ✅ Filter swaps by nearby location
- ✅ Infinite scroll feed
- ✅ Pull to refresh

---

## ⏱️ Timeline

**Total:** 4-5 weeks (47-60 hours)

**Week 1:**
- Database expansion (1 day)
- Barcode component extraction (1 day)
- Image upload setup (2 days)
- Start post creation (1 day)

**Week 2:**
- Complete post creation (social + swap)
- Test post creation flow

**Week 3:**
- Build dual-tab feed
- Implement infinite scroll
- Empty states

**Week 4:**
- Social engagement (likes/comments)
- Real-time updates with Supabase
- Optimistic UI

**Week 5:**
- Book detail page
- User profiles (view/edit)
- Testing & polish

---

## 🚀 Getting Started

### **Step 1: Database (30 min)**
```bash
# Open Supabase SQL Editor
# Copy SQL from POSTS_EXPANSION.md
# Run all migrations
# Verify with test queries
```

### **Step 2: Install Packages (5 min)**
```bash
# Install location package
npx expo install expo-location

# Already have:
# - expo-camera (Phase 1)
# - expo-image-picker (Phase 1)
# - expo-image-manipulator (Phase 1)
```

### **Step 3: Extract Barcode (1-2 hours)**
```bash
# Follow BARCODE_COMPONENT.md
# Create src/components/BarcodeScanner.tsx
# Refactor FirstPostScreen to use it
# Test still works
```

### **Step 4: Image Upload (3-4 hours)**
```bash
# Follow IMAGES_SPEC.md
# Create image picker service
# Test upload to post-images bucket
# Verify 5MB compression
```

### **Step 5: Build Screens (with Claude Code)**
```
You to Claude Code:
"Build Phase 2 screens following docs/phase-2/:
1. Post creation screens (social + swap)
2. Dual-tab feed
3. Engagement (likes/comments)
4. Book detail page
5. User profiles"
```

---

## 🤖 Using with Claude Code

### **Option A: Claude Builds Everything**
```
"Build all Phase 2 screens and features following docs/phase-2/ specifications.
Start with post creation, then feed, then engagement, then profiles."
```

### **Option B: Section by Section**
```
"Build post creation screens following POST_CREATION_SPEC.md"
[test it]
"Build dual-tab feed following FEED_SPEC.md"
[test it]
"Build engagement features following ENGAGEMENT_SPEC.md"
[etc.]
```

---

## 📋 Key Features Explained

### **Dual-Tab Feed:**
- **Feed Tab:** Shows ALL posts (social + swap) chronologically
- **Swaps Tab:** Shows ONLY swap posts, filtered by nearby location
- Each tab has infinite scroll, pull-to-refresh

### **Post Types:**
**Social Post:**
- Title + Author (scanned or manual)
- Cover image from Google Books
- Optional caption
- No swap fields

**Swap Post:**
- Everything from social post, plus:
- Photo of actual book (uploaded)
- Condition (new, like_new, good, acceptable, poor)
- Genre (fiction, non-fiction, mystery, etc.)
- Swap type (trade, borrow, gift)
- User's location (for nearby filtering)

### **Real-time Updates:**
Uses Supabase Realtime subscriptions:
```typescript
// Subscribe to likes on a post
supabase
  .channel('likes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'likes',
    filter: `post_id=eq.${postId}`
  }, (payload) => {
    // Update like count in real-time
  })
  .subscribe();
```

### **Nearby Swaps:**
Uses PostGIS to filter by distance:
```sql
-- Get swaps within 25km of user
SELECT * FROM posts 
WHERE post_type = 'swap' 
  AND ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint($userLng, $userLat), 4326)::geography,
    25000  -- 25km in meters
  );
```

---

## ✅ Phase 2 Checklist

**Database:**
- [ ] Posts table expanded with swap fields
- [ ] Likes table created
- [ ] Comments table created
- [ ] post-images bucket created (5MB limit)
- [ ] All RLS policies set up

**Components:**
- [ ] BarcodeScanner component (reusable)
- [ ] PostCard component (with like/comment)
- [ ] CommentItem component
- [ ] ImagePicker working

**Screens:**
- [ ] CreatePostScreen (choose type)
- [ ] SocialPostScreen
- [ ] SwapPostScreen (with image + details)
- [ ] FeedScreen (dual tabs)
- [ ] BookDetailScreen
- [ ] EditProfileScreen
- [ ] OtherUserProfileScreen

**Features:**
- [ ] Can create social posts
- [ ] Can create swap posts with image
- [ ] Feed shows posts with infinite scroll
- [ ] Swaps tab filters by nearby
- [ ] Can like/unlike posts
- [ ] Can comment on posts
- [ ] Real-time updates working
- [ ] Pull-to-refresh working
- [ ] Can view book details
- [ ] Can view other profiles
- [ ] Can edit own profile (city/bio)

---

## 🐛 Common Issues

**Issue:** Real-time not working  
**Fix:** Check Supabase Realtime is enabled in project settings

**Issue:** Images not uploading  
**Fix:** Check post-images bucket exists, check storage policies

**Issue:** Nearby filter not working  
**Fix:** Verify location column has PostGIS geography type

**Issue:** Feed performance slow  
**Fix:** Use pagination (limit + offset), enable list optimization

**Issue:** Like count out of sync  
**Fix:** Use optimistic updates + revert on error

---

## 🎯 Success Criteria

Phase 2 is complete when:
- ✅ All database tables/buckets created
- ✅ Can create both post types
- ✅ Feed shows posts correctly
- ✅ Likes/comments work in real-time
- ✅ Images upload successfully
- ✅ Nearby filter works
- ✅ Profiles display correctly
- ✅ All tests passing

---

## 🚀 What's Next?

**When Phase 2 is done:**
1. Update STATUS.md - all sections ✅
2. Fill out CHECKPOINT_PHASE_2.md
3. Come back and say: **"Phase 2 complete, create Phase 3 docs"**
4. I'll create Phase 3 (Swap Execution: requests, inbox, chat)

---

**Phase 2 builds the heart of Readrr - the social book-swapping experience!** 📚❤️

