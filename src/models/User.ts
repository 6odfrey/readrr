export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  avg_rating: number;
  total_swaps: number;
  subscription_status: 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled';
  stripe_customer_id: string | null;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
}
