export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface Swap {
  id: string;
  requester_id: string;
  owner_id: string;
  post_id: string;
  status: SwapStatus;
  request_message?: string;
  requester_confirmed_complete: boolean;
  owner_confirmed_complete: boolean;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  completed_at?: string;

  // Joined data
  requester?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  owner?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    title: string;
    author?: string;
    cover_image_url?: string;
    image_url?: string;
  };
  unread_count?: number;
}
