import { supabase } from '../config/supabase';
import { Message } from '../models/Message';

// Get messages for a swap
export async function getMessages(swapId: string, limit: number = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, username, avatar_url)
    `)
    .eq('swap_id', swapId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Send a message
export async function sendMessage(
  swapId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      swap_id: swapId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, username, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

// Mark messages as read
export async function markMessagesAsRead(swapId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_messages_read', {
    swap_uuid: swapId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Get unread count for a swap
export async function getUnreadCount(swapId: string, userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_count', {
    swap_uuid: swapId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return data || 0;
}
