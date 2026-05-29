import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { getUserPosts } from '../../services/postsService';
import { User } from '../../models/User';
import { Post } from '../../models/Post';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Props {
  navigation: any;
}

export default function OtherUserProfileScreen({ navigation }: Props) {
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [userId])
  );

  const loadData = async () => {
    try {
      // Load user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Load posts
      const postsData = await getUserPosts(userId);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  const renderHeader = () => (
    <View>
      {/* Profile Header */}
      <View className="items-center pt-6 pb-4 px-6">
        <Avatar avatarUrl={user.avatar_url} username={user.username} size={100} />
        <Text className="text-2xl font-bold mt-4">@{user.username}</Text>
        {user.city && <Text className="text-gray-500 mt-1">{user.city}</Text>}
        {user.bio && (
          <Text className="text-gray-700 text-center mt-3 px-4">{user.bio}</Text>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row justify-around py-4 border-y border-gray-200 mx-6">
        <View className="items-center">
          <Text className="text-2xl font-bold">{user.total_swaps}</Text>
          <Text className="text-gray-500">Swaps</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold">
            {user.avg_rating?.toFixed(1) || '0.0'}
          </Text>
          <Text className="text-gray-500">Rating</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold">{posts.length}</Text>
          <Text className="text-gray-500">Posts</Text>
        </View>
      </View>

      {/* Posts Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="font-semibold text-lg">Posts</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center py-12">
      <Text className="text-gray-500">No posts yet</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center font-semibold text-lg">
          @{user.username}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
