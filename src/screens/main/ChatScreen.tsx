import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { Swap } from '../../models/Swap';
import { Message } from '../../models/Message';
import { getSwap, confirmSwapComplete } from '../../services/swapsService';
import { getMessages, sendMessage, markMessagesAsRead } from '../../services/messagesService';
import Avatar from '../../components/Avatar';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Props {
  navigation: any;
}

export default function ChatScreen({ navigation }: Props) {
  const route = useRoute();
  const { swapId } = route.params as { swapId: string };
  const session = useAuthStore((state) => state.session);

  const [swap, setSwap] = useState<Swap | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, [swapId]);

  useEffect(() => {
    if (!swapId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${swapId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `swap_id=eq.${swapId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Fetch the full message with sender data
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, username, avatar_url)
            `)
            .eq('id', newMsg.id)
            .single();

          if (fullMessage) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === fullMessage.id)) return prev;
              return [...prev, fullMessage];
            });
          }

          // Mark as read if not from current user
          if (newMsg.sender_id !== session?.user.id) {
            markMessagesAsRead(swapId, session?.user.id || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [swapId, session]);

  const loadData = async () => {
    try {
      const [swapData, messagesData] = await Promise.all([
        getSwap(swapId),
        getMessages(swapId),
      ]);

      if (!swapData) {
        Alert.alert('Error', 'Swap not found');
        navigation.goBack();
        return;
      }

      setSwap(swapData);
      setMessages(messagesData);

      // Mark messages as read
      if (session?.user.id) {
        markMessagesAsRead(swapId, session.user.id);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !session?.user.id || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendMessage(swapId, session.user.id, messageText);
      // Message will appear via realtime subscription
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkComplete = () => {
    if (!swap || !session?.user.id) return;

    // Require at least one message before completing
    if (messages.length === 0) {
      Alert.alert(
        'Exchange Messages First',
        'You need to exchange at least one message with your swap partner before marking the swap as complete. This helps ensure you\'ve coordinated the exchange.'
      );
      return;
    }

    const isOwner = swap.owner_id === session.user.id;
    const alreadyConfirmed = isOwner
      ? swap.owner_confirmed_complete
      : swap.requester_confirmed_complete;

    if (alreadyConfirmed) {
      Alert.alert('Already Confirmed', 'You have already confirmed this swap as complete. Waiting for the other person to confirm.');
      return;
    }

    Alert.alert(
      'Mark Swap as Complete',
      'Have you successfully completed this book swap in person?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            setCompleting(true);
            try {
              const { bothConfirmed } = await confirmSwapComplete(
                swapId,
                session.user.id,
                isOwner
              );

              if (bothConfirmed) {
                Alert.alert(
                  'Swap Complete! 🎉',
                  'Congratulations! Both users have confirmed. The swap is now complete and your swap count has been updated.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert(
                  'Waiting for Confirmation',
                  'You\'ve confirmed the swap. Waiting for the other person to confirm.',
                );
                // Reload swap to update UI
                const updatedSwap = await getSwap(swapId);
                setSwap(updatedSwap);
              }
            } catch (error) {
              console.error('Error completing swap:', error);
              Alert.alert('Error', 'Failed to mark swap as complete');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isOwnMessage = message.sender_id === session?.user.id;
    const time = new Date(message.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        className={`mx-4 my-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
            isOwnMessage ? 'bg-blue-500 rounded-br-sm' : 'bg-gray-200 rounded-bl-sm'
          }`}
        >
          <Text
            style={{
              fontSize: 16,
              color: isOwnMessage ? '#fff' : '#1f2937',
            }}
          >
            {message.content}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, marginHorizontal: 4 }}>
          {time}
        </Text>
      </View>
    );
  };

  if (loading || !swap) {
    return <LoadingSpinner fullScreen />;
  }

  // If swap is completed, show completion screen
  if (swap.status === 'completed') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text style={{ fontSize: 16, color: '#38B6FF' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600' }}>Swap Complete</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            Swap Complete!
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
            You successfully swapped "{swap.post?.title}" with @{otherUser?.username}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-green-500 px-8 py-3 rounded-xl"
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = swap.owner_id === session?.user.id;
  const otherUser = isOwner ? swap.requester : swap.owner;
  const myConfirmation = isOwner ? swap.owner_confirmed_complete : swap.requester_confirmed_complete;
  const theirConfirmation = isOwner ? swap.requester_confirmed_complete : swap.owner_confirmed_complete;
  const anyoneConfirmed = myConfirmation || theirConfirmation;
  const isCompleted = swap.status === 'completed';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text style={{ fontSize: 16, color: '#38B6FF' }}>← Back</Text>
        </TouchableOpacity>
        <Avatar
          avatarUrl={otherUser?.avatar_url}
          username={otherUser?.username || 'User'}
          size={36}
        />
        <View className="ml-3 flex-1">
          <Text style={{ fontSize: 16, fontWeight: '600' }}>@{otherUser?.username}</Text>
          <Text style={{ fontSize: 13, color: '#6b7280' }} numberOfLines={1}>
            {swap.post?.title}
          </Text>
        </View>
      </View>

      {/* Completion Status Banner */}
      {(myConfirmation || theirConfirmation) && swap.status === 'accepted' && (
        <View className="bg-yellow-50 px-4 py-2 border-b border-yellow-100">
          <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center' }}>
            {myConfirmation && !theirConfirmation
              ? '✓ You confirmed. Waiting for other person...'
              : !myConfirmation && theirConfirmation
              ? '⏳ Other person confirmed. Your turn to confirm!'
              : ''}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
              <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', paddingHorizontal: 40 }}>
                Start chatting to arrange your book swap!
              </Text>
            </View>
          }
        />

        {/* Mark Complete Button */}
        {swap.status === 'accepted' && (
          <TouchableOpacity
            onPress={handleMarkComplete}
            disabled={completing || (myConfirmation && !theirConfirmation)}
            className={`mx-4 py-3 rounded-xl ${
              myConfirmation ? 'bg-gray-200' : 'bg-green-500'
            }`}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: myConfirmation ? '#6b7280' : '#fff',
                textAlign: 'center',
              }}
            >
              {completing
                ? 'Processing...'
                : myConfirmation
                ? '✓ You\'ve Confirmed'
                : '✓ Mark Swap as Complete'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Input - Disabled when anyone has marked complete */}
        {anyoneConfirmed ? (
          <View className="px-4 py-4 border-t border-gray-100 bg-gray-50">
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
              {myConfirmation
                ? 'Chat disabled. Waiting for other person to confirm swap.'
                : 'Chat disabled. Please confirm the swap to complete.'}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              style={{
                flex: 1,
                maxHeight: 100,
                backgroundColor: '#f3f4f6',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 16,
              }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
              className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                newMessage.trim() ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text style={{ fontSize: 18, color: newMessage.trim() ? '#fff' : '#9ca3af' }}>
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
