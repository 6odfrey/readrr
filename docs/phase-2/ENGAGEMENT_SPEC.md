# Phase 2: Social Engagement Implementation

**For:** Claude Code  
**Purpose:** Likes, comments, and real-time updates with Supabase

---

## 📋 Overview

Social engagement features:
1. **Like/Unlike** posts
2. **Comment** on posts
3. **Real-time updates** when others like/comment
4. **Optimistic UI** for instant feedback

---

## 🎯 Features

- Tap heart to like/unlike
- Like count updates in real-time
- Comment on posts
- Comment count updates in real-time
- See new comments appear instantly
- Optimistic UI (no waiting for server)

---

## 🗂️ Files to Create/Update

1. `src/services/engagementService.ts` - Like/comment CRUD
2. `src/components/PostCard.tsx` - Post display with engagement
3. `src/components/CommentItem.tsx` - Comment display
4. `src/screens/main/PostDetailScreen.tsx` - Full post with comments (optional)

---

## 🛠️ Service: Engagement Service

**File:** `src/services/engagementService.ts`

```typescript
import { supabase } from '../config/supabase';

// ============================================
// LIKES
// ============================================

export async function likePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('likes')
    .insert({
      post_id: postId,
      user_id: userId,
    });
  
  if (error) throw error;
}

export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ post_id: postId, user_id: userId });
  
  if (error) throw error;
}

export async function getPostLikes(postId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('*, user:users(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  
  if (error) throw error;
  return count || 0;
}

export async function hasUserLiked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .match({ post_id: postId, user_id: userId })
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
}

// ============================================
// COMMENTS
// ============================================

export async function createComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select('*, user:users(username, avatar_url)')
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPostComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  
  if (error) throw error;
}

export async function getCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  
  if (error) throw error;
  return count || 0;
}
```

---

## 🧩 Component: PostCard

**File:** `src/components/PostCard.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';
import { likePost, unlikePost } from '../services/engagementService';
import Avatar from './Avatar';

interface Post {
  id: string;
  title: string;
  author?: string;
  cover_url?: string;
  image_url?: string;
  post_type: 'social' | 'swap';
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const navigation = useNavigation();
  const session = useAuthStore(state => state.session);
  
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial counts
  useEffect(() => {
    loadCounts();
    checkIfLiked();
    subscribeToChanges();
  }, [post.id]);

  const loadCounts = async () => {
    try {
      // Get like count
      const { count: likes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      // Get comment count
      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      setLikeCount(likes || 0);
      setCommentCount(comments || 0);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const checkIfLiked = async () => {
    if (!session) return;
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .match({ post_id: post.id, user_id: session.user.id })
        .maybeSingle();
      
      setHasLiked(!!data);
    } catch (error) {
      console.error('Error checking like:', error);
    }
  };

  // Real-time subscriptions
  const subscribeToChanges = () => {
    // Subscribe to likes
    const likesChannel = supabase
      .channel(`likes:${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${post.id}`
        },
        (payload) => {
          setLikeCount(prev => prev + 1);
          // Check if current user liked
          if (payload.new.user_id === session?.user.id) {
            setHasLiked(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${post.id}`
        },
        () => {
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    // Subscribe to comments
    const commentsChannel = supabase
      .channel(`comments:${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`
        },
        () => {
          setCommentCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`
        },
        () => {
          setCommentCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  };

  const handleLike = async () => {
    if (!session || loading) return;
    
    // Optimistic update
    const previousLiked = hasLiked;
    const previousCount = likeCount;
    
    setHasLiked(!hasLiked);
    setLikeCount(prev => hasLiked ? prev - 1 : prev + 1);
    setLoading(true);
    
    try {
      if (hasLiked) {
        await unlikePost(post.id, session.user.id);
      } else {
        await likePost(post.id, session.user.id);
      }
    } catch (error) {
      // Revert on error
      setHasLiked(previousLiked);
      setLikeCount(previousCount);
      Alert.alert('Error', 'Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  return (
    <View className="bg-white mb-4 pb-4">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Avatar avatarUrl={post.user.avatar_url} username={post.user.username} size={40} />
        <View className="ml-3 flex-1">
          <Text className="font-semibold">@{post.user.username}</Text>
          <Text className="text-gray-500 text-xs">
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Book Info */}
      <View className="px-4 mb-3">
        <Text className="font-bold text-lg">{post.title}</Text>
        {post.author && (
          <Text className="text-gray-600">{post.author}</Text>
        )}
      </View>

      {/* Image */}
      {(post.image_url || post.cover_url) && (
        <Image
          source={{ uri: post.image_url || post.cover_url }}
          style={{ width: '100%', height: 300 }}
          contentFit="cover"
        />
      )}

      {/* Engagement Buttons */}
      <View className="flex-row items-center px-4 mt-3">
        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          disabled={loading}
          className="flex-row items-center mr-6"
        >
          <Text className="text-2xl mr-2">
            {hasLiked ? '❤️' : '🤍'}
          </Text>
          <Text className="text-gray-700 font-semibold">
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={handleComment}
          className="flex-row items-center"
        >
          <Text className="text-2xl mr-2">💬</Text>
          <Text className="text-gray-700 font-semibold">
            {commentCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 🧩 Component: CommentItem

**File:** `src/components/CommentItem.tsx`

```typescript
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Avatar from './Avatar';
import { deleteComment } from '../services/engagementService';
import { useAuthStore } from '../store/authStore';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

interface Props {
  comment: Comment;
  onDelete?: () => void;
}

export default function CommentItem({ comment, onDelete }: Props) {
  const session = useAuthStore(state => state.session);
  const isOwn = session?.user.id === comment.user_id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id);
              onDelete?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-row px-4 py-3">
      <Avatar avatarUrl={comment.user.avatar_url} username={comment.user.username} size={32} />
      
      <View className="ml-3 flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="font-semibold mr-2">@{comment.user.username}</Text>
          <Text className="text-gray-500 text-xs">
            {new Date(comment.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <Text className="text-gray-800">{comment.content}</Text>
        
        {isOwn && (
          <TouchableOpacity onPress={handleDelete} className="mt-1">
            <Text className="text-red-500 text-xs">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

---

## 📱 Screen: Post Detail (Optional but Recommended)

**File:** `src/screens/main/PostDetailScreen.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { createComment, getPostComments } from '../../services/engagementService';
import PostCard from '../../components/PostCard';
import CommentItem from '../../components/CommentItem';

export default function PostDetailScreen() {
  const route = useRoute();
  const { postId } = route.params as { postId: string };
  const session = useAuthStore(state => state.session);
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    subscribeToComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:users(username, avatar_url)')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await getPostComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          // Fetch the new comment with user data
          const { data } = await supabase
            .from('comments')
            .select('*, user:users(username, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            setComments(prev => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !session || posting) return;
    
    setPosting(true);
    
    try {
      await createComment(postId, session.user.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading || !post) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView>
        {/* Post */}
        <PostCard post={post} />
        
        {/* Comments */}
        <View className="border-t border-gray-200 pt-4">
          <Text className="px-4 font-bold text-lg mb-3">
            Comments ({comments.length})
          </Text>
          
          {comments.length === 0 ? (
            <Text className="px-4 text-gray-500 text-center py-8">
              No comments yet. Be the first!
            </Text>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={loadComments}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View className="border-t border-gray-200 px-4 py-3 flex-row items-center">
        <TextInput
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          maxLength={500}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3"
        />
        <TouchableOpacity
          onPress={handlePostComment}
          disabled={!newComment.trim() || posting}
          className={`px-4 py-2 rounded-full ${
            newComment.trim() ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white font-semibold">
            {posting ? '...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## ⚡ Real-time Setup

**Important:** Enable Realtime in Supabase!

1. Go to Supabase Dashboard
2. Database → Replication
3. Enable replication for `likes` and `comments` tables
4. Click the toggle to enable

---

## ✅ Testing Checklist

**Likes:**
- [ ] Can like a post (heart turns red)
- [ ] Like count increments immediately (optimistic)
- [ ] Can unlike a post (heart turns white)
- [ ] Like count decrements immediately
- [ ] Like persists in database
- [ ] Real-time: See others' likes appear
- [ ] Real-time: Like count updates without refresh
- [ ] Error handling: Reverts on failure

**Comments:**
- [ ] Can comment on a post
- [ ] Comment appears immediately
- [ ] Comment count increments
- [ ] Can view all comments on PostDetail
- [ ] Can delete own comments
- [ ] Cannot delete others' comments
- [ ] Real-time: See others' comments appear
- [ ] Real-time: Comment count updates
- [ ] Max 500 characters enforced

**Real-time:**
- [ ] Subscribes to likes channel
- [ ] Subscribes to comments channel
- [ ] Updates appear within 1-2 seconds
- [ ] Multiple devices see updates
- [ ] Unsubscribes on unmount (no memory leaks)

---

## 🐛 Common Issues

**Issue:** Real-time not working  
**Fix:** Check Supabase Realtime enabled, check replication enabled on tables

**Issue:** Optimistic updates out of sync  
**Fix:** Ensure revert logic works on errors, reload counts periodically

**Issue:** Memory leak warnings  
**Fix:** Unsubscribe from channels in cleanup function

**Issue:** Like/unlike spamming  
**Fix:** Add loading state, debounce rapid taps

**Issue:** Comments not loading  
**Fix:** Check RLS policies allow authenticated users to read

---

## 🎯 Performance Tips

1. **Pagination:** Load comments in batches (20 at a time)
2. **Debouncing:** Debounce like button (prevent spam)
3. **Unsubscribe:** Always cleanup subscriptions
4. **Optimistic UI:** Update UI immediately, revert on error
5. **Channel naming:** Use unique channel names per post

---

**Engagement features complete! Test real-time with 2 devices!** ✅
