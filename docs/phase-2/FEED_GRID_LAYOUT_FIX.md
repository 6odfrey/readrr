# Phase 2: Feed Layout - 2-Column Grid Fix

**Issue:** Feed shows Instagram-style single column  
**Solution:** Change to 2-column grid layout (bookshelf style)

---

## 🎯 Goal

**Before (Current):**
```
┌────────────────┐
│   Post 1       │
│   (full width) │
├────────────────┤
│   Post 2       │
│   (full width) │
├────────────────┤
│   Post 3       │
└────────────────┘
```

**After (Grid):**
```
┌────────┬────────┐
│ Book 1 │ Book 2 │
│ 140x170│ 140x170│
├────────┼────────┤
│ Book 3 │ Book 4 │
│ 140x170│ 140x170│
└────────┴────────┘
```

---

## 📱 Updated FeedScreen with Grid

**File:** `src/screens/main/FeedScreen.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../config/supabase';
import { useNavigation } from '@react-navigation/native';
import Avatar from '../../components/Avatar';

export default function FeedScreen() {
  const navigation = useNavigation();
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
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const renderBookCard = ({ item: post }: { item: any }) => {
    const imageUrl = post.image_url || post.cover_url;
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BookDetail', { postId: post.id })}
        className="w-[48%] mb-4" // 48% width = 2 columns with gap
        style={{ aspectRatio: 140/210 }} // Maintain aspect ratio
      >
        {/* Book Cover */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: 170 }}
            contentFit="cover"
            className="rounded-lg mb-2"
          />
        ) : (
          <View 
            style={{ width: '100%', height: 170 }}
            className="bg-gray-200 rounded-lg mb-2 items-center justify-center"
          >
            <Text className="text-4xl">📚</Text>
          </View>
        )}
        
        {/* Title */}
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
        
        {/* User Info */}
        <View className="flex-row items-center">
          <Avatar 
            avatarUrl={post.user.avatar_url} 
            username={post.user.username} 
            size={20} 
          />
          <Text className="text-gray-500 text-xs ml-2" numberOfLines={1}>
            @{post.user.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={posts}
        renderItem={renderBookCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingTop: 16,
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

## 🎨 Alternative: Pure Grid Layout (More Control)

If you want more control over spacing:

```typescript
export default function FeedScreen() {
  // ... same state and loadPosts ...

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={posts}
        renderItem={renderBookCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          gap: 12, // Space between columns
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingTop: 16,
          gap: 16, // Space between rows
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

// Updated renderBookCard
const renderBookCard = ({ item: post }: { item: any }) => {
  const imageUrl = post.image_url || post.cover_url;
  const cardWidth = (Dimensions.get('window').width - 44) / 2; // 16px padding + 12px gap
  
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookDetail', { postId: post.id })}
      style={{ width: cardWidth }}
      className="mb-4"
    >
      {/* Book Cover - FIXED SIZE */}
      {imageUrl ? (
        <View style={{ width: cardWidth, height: 170 }} className="mb-2">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            className="rounded-lg"
          />
        </View>
      ) : (
        <View 
          style={{ width: cardWidth, height: 170 }}
          className="bg-gray-200 rounded-lg mb-2 items-center justify-center"
        >
          <Text className="text-4xl">📚</Text>
        </View>
      )}
      
      {/* Book Info */}
      <Text className="font-semibold text-sm mb-1" numberOfLines={2}>
        {post.title}
      </Text>
      
      {post.author && (
        <Text className="text-gray-600 text-xs mb-2" numberOfLines={1}>
          {post.author}
        </Text>
      )}
      
      {/* User */}
      <View className="flex-row items-center">
        <Avatar avatarUrl={post.user.avatar_url} username={post.user.username} size={18} />
        <Text className="text-gray-500 text-xs ml-1 flex-1" numberOfLines={1}>
          @{post.user.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
```

---

## 📐 Exact Dimensions (140w × 170h)

If you want EXACT pixel dimensions:

```typescript
import { Dimensions } from 'react-native';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 170;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 16;
const GAP = (SCREEN_WIDTH - (CARD_WIDTH * 2) - (PADDING * 2)) / 1; // Auto-calculate gap

const renderBookCard = ({ item: post }: { item: any }) => {
  const imageUrl = post.image_url || post.cover_url;
  
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookDetail', { postId: post.id })}
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      {/* Fixed 140x170 cover */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          contentFit="cover"
          className="rounded-lg mb-2"
        />
      ) : (
        <View 
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          className="bg-gray-200 rounded-lg mb-2 items-center justify-center"
        >
          <Text className="text-4xl">📚</Text>
        </View>
      )}
      
      {/* Title (max 2 lines) */}
      <Text 
        className="font-semibold text-xs mb-1" 
        numberOfLines={2}
        style={{ width: CARD_WIDTH }}
      >
        {post.title}
      </Text>
      
      {/* Author (max 1 line) */}
      {post.author && (
        <Text 
          className="text-gray-500 text-xs mb-2" 
          numberOfLines={1}
          style={{ width: CARD_WIDTH }}
        >
          {post.author}
        </Text>
      )}
      
      {/* User (smaller) */}
      <View className="flex-row items-center" style={{ width: CARD_WIDTH }}>
        <Avatar avatarUrl={post.user.avatar_url} username={post.user.username} size={16} />
        <Text className="text-gray-400 text-xs ml-1 flex-1" numberOfLines={1}>
          @{post.user.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// FlatList props
<FlatList
  data={posts}
  renderItem={renderBookCard}
  keyExtractor={(item) => item.id}
  numColumns={2}
  columnWrapperStyle={{
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
  }}
  contentContainerStyle={{
    paddingTop: 16,
    paddingBottom: 100,
  }}
/>
```

---

## 🎯 Key Changes

**From Instagram Style:**
- ❌ Full-width posts
- ❌ Large images (300-400px height)
- ❌ Engagement buttons visible
- ❌ Single column

**To Grid Style:**
- ✅ 2 columns
- ✅ Fixed size: 140w × 170h
- ✅ Small user info below
- ✅ Tap to see details
- ✅ Clean, bookshelf-like

---

## 🔧 What to Tell Claude Code

```
Claude Code, please update the FeedScreen to show a 2-column grid layout instead of Instagram-style posts.

Requirements:
- 2 columns (side by side)
- Each book card: 140px width × 170px height
- Show book cover (from cover_url or image_url)
- Below cover: book title (max 2 lines, small font)
- Below title: author (max 1 line, gray, smaller font)
- Below author: small avatar + @username (very small)
- Cards should be tappable to open book detail
- Use FlatList with numColumns={2}
- Add proper spacing between cards
- No engagement buttons on cards (those go in detail view)

Reference docs/phase-2/FEED_GRID_LAYOUT_FIX.md for implementation.
```

---

## ✅ Result

Your feed will look like a bookshelf:
```
┌──────────┬──────────┐
│ [Cover]  │ [Cover]  │
│ Title    │ Title    │
│ Author   │ Author   │
│ @user    │ @user    │
├──────────┼──────────┤
│ [Cover]  │ [Cover]  │
│ Title    │ Title    │
│ Author   │ Author   │
│ @user    │ @user    │
└──────────┴──────────┘
```

**Much better for browsing books!** 📚✨
