export interface Message {
  id: string;
  swap_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  sender?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}
