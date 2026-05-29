# Phase 2: Proper 2-Column Social Feed Layout

**Goal:** Classic 2×2 grid with user info on top, engagement below each card

---

## 🎨 Desired Layout

```
┌─────────────────────────────────────┐
│  Padding (16px)                     │
│  ┌────────────┐  ┌────────────┐    │
│  │ [@user] 👤 │  │ [@user] 👤 │    │  ← User info on top
│  │            │  │            │    │
│  │  [Cover]   │  │  [Cover]   │    │  ← Book cover
│  │  140×170   │  │  140×170   │    │
│  │            │  │            │    │
│  │  Title     │  │  Title     │    │  ← Book title
│  │  Author    │  │  Author    │    │  ← Author
│  │            │  │            │    │
│  │  ❤️ 24 💬 8│  │  ❤️ 12 💬 3│    │  ← Engagement
│  └────────────┘  └────────────┘    │
│     Gap: 12px                       │
│  ┌────────────┐  ┌────────────┐    │
│  │ [@user] 👤 │  │ [@user] 👤 │    │
│  │  [Cover]   │  │  [Cover]   │    │
│  │  Title     │  │  Title     │    │
│  │  ❤️ 15 💬 5│  │  ❤️ 8  💬 2│    │
│  └────────────┘  └────────────┘    │
│  Padding (16px)                     │
└─────────────────────────────────────┘
```

---

## 📱 Complete FeedScreen Implementation

**File:** `src/screens/main/FeedScreen.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../config/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { likePost, unlikePost } from '../../services/engagementService';
import Avatar from '../../components/Avatar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 16; // Outer padding
const GAP = 12; // Gap between cards
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 2) - GAP) / 2; // Auto-calculate card width
const COVER_HEIGHT = 170;

export default function FeedScreen() {
  const navigation = useNavigation();
  const session = useAuthStore(state => state.session);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Load engagement counts for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likeCount, commentCount, hasLiked] = await Promise.all([
            getLikeCount(post.id),
            getCommentCount(post.id),
            checkIfLiked(post.id),
          ]);
          
          return {
            ...post,
            likeCount,
            commentCount,
            hasLiked,
          };
        })
      );
      
      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLikeCount = async (postId: string) => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    return count || 0;
  };

  const getCommentCount = async (postId: string) => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    return count || 0;
  };

  const checkIfLiked = async (postId: string) => {
    if (!session) return false;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .match({ post_id: postId, user_id: session.user.id })
      .maybeSingle();
    return !!data;
  };

  const handleLike = async (post: any) => {
    if (!session) return;
    
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          hasLiked: !p.hasLiked,
          likeCount: p.hasLiked ? p.likeCount - 1 : p.likeCount + 1,
        };
      }
      return p;
    }));
    
    try {
      if (post.hasLiked) {
        await unlikePost(post.id, session.user.id);
      } else {
        await likePost(post.id, session.user.id);
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            hasLiked: post.hasLiked,
            likeCount: post.likeCount,
          };
        }
        return p;
      }));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const renderPostCard = ({ item: post }: { item: any }) => {
    const imageUrl = post.image_url || post.cover_url;
    
    return (
      <View style={{ width: CARD_WIDTH }} className="mb-4">
        {/* User Info on Top */}
        <View className="flex-row items-center mb-2">
          <Avatar 
            avatarUrl={post.user.avatar_url} 
            username={post.user.username} 
            size={24} 
          />
          <Text className="text-xs font-medium ml-2 flex-1" numberOfLines={1}>
            @{post.user.username}
          </Text>
        </View>
        
        {/* Book Cover - Tappable */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
          activeOpacity={0.8}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: CARD_WIDTH, height: COVER_HEIGHT }}
              contentFit="cover"
              className="rounded-lg mb-2"
            />
          ) : (
            <View 
              style={{ width: CARD_WIDTH, height: COVER_HEIGHT }}
              className="bg-gray-200 rounded-lg mb-2 items-center justify-center"
            >
              <Text className="text-4xl">📚</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Book Title */}
        <Text 
          className="font-semibold text-sm mb-1" 
          numberOfLines={2}
        >
          {post.title}
        </Text>
        
        {/* Author */}
        {post.author && (
          <Text 
            className="text-gray-600 text-xs mb-2" 
            numberOfLines={1}
          >
            {post.author}
          </Text>
        )}
        
        {/* Engagement Buttons */}
        <View className="flex-row items-center mt-1">
          {/* Like Button */}
          <TouchableOpacity
            onPress={() => handleLike(post)}
            className="flex-row items-center mr-4"
            activeOpacity={0.7}
          >
            <Text className="text-lg mr-1">
              {post.hasLiked ? '❤️' : '🤍'}
            </Text>
            <Text className="text-xs text-gray-700 font-medium">
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          
          {/* Comment Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Text className="text-lg mr-1">💬</Text>
            <Text className="text-xs text-gray-700 font-medium">
              {post.commentCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: PADDING,
          gap: GAP,
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-500 text-center">
              No posts yet. Create your first post!
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

---

## 🎨 Visual Breakdown

**Each Card Contains (Top to Bottom):**

1. **User Info (Top)**
   - Small avatar (24px)
   - @username
   - Spacing: 8px below

2. **Book Cover**
   - Image: Dynamic width × 170px height
   - Rounded corners
   - Tappable (opens detail)
   - Spacing: 8px below

3. **Book Info**
   - Title: Bold, 2 lines max
   - Author: Gray, 1 line max
   - Spacing: 8px below

4. **Engagement (Bottom)**
   - Like: ❤️/🤍 + count (tappable)
   - Comment: 💬 + count (tappable)

---

## 📐 Spacing Details

```
Screen Layout:
┌─────────────────────────────────────┐
│ ← 16px padding                      │
│                                     │
│  [Card]  ← 12px gap →  [Card]      │
│  Auto width           Auto width   │
│                                     │
│         ← 16px padding →            │
└─────────────────────────────────────┘

Card Width Calculation:
(Screen Width - 32px padding - 12px gap) ÷ 2

Example (iPhone 14):
(390px - 32px - 12px) ÷ 2 = 173px per card

Gap Between Cards: 12px (visually pleasing)
Gap Between Rows: 16px (via marginBottom)
```

---

## ✅ Key Features

**Centered & Balanced:**
- ✅ Equal padding on both sides (16px)
- ✅ Cards auto-size to fit perfectly
- ✅ Consistent gap between columns (12px)
- ✅ Consistent gap between rows (16px)

**User-Friendly:**
- ✅ User info on top (know who posted)
- ✅ Engagement below (easy to like/comment)
- ✅ Tap cover to see detail
- ✅ Optimistic UI (instant feedback)

**Performance:**
- ✅ Loads engagement counts once
- ✅ Optimistic updates for likes
- ✅ Pull-to-refresh
- ✅ Smooth scrolling

---

## 🎯 Customization Options

**Adjust Padding (Wider/Narrower Cards):**
```typescript
const PADDING = 20; // More padding = narrower cards
const PADDING = 12; // Less padding = wider cards
```

**Adjust Gap (Closer/Further Apart):**
```typescript
const GAP = 16; // Cards further apart
const GAP = 8;  // Cards closer together
```

**Adjust Cover Height:**
```typescript
const COVER_HEIGHT = 200; // Taller covers
const COVER_HEIGHT = 150; // Shorter covers
```

---

## 🐛 Testing

**Test these scenarios:**
- [ ] Cards are evenly spaced
- [ ] Cards don't touch screen edges
- [ ] Gap between cards looks good
- [ ] User info readable
- [ ] Can tap to like
- [ ] Can tap to comment
- [ ] Can tap cover for detail
- [ ] Works on different screen sizes

---

## 🔧 What to Tell Claude Code

```
Claude Code, update FeedScreen to this layout:

2-column grid with proper spacing:
- 16px padding from screen edges
- 12px gap between cards
- Cards auto-sized to fit perfectly

Each card shows (top to bottom):
1. User avatar + @username (small, on top)
2. Book cover image (tap to open detail)
3. Book title (bold, 2 lines max)
4. Author name (gray, 1 line)
5. Engagement: ❤️ count, 💬 count (tappable)

Use the code from FEED_PROPER_GRID_LAYOUT.md
Make it look clean and balanced, not cramped.
```

---

**This should give you the perfect Instagram-style grid with engagement!** 📚✨
