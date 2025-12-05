
export type UserRole = 'DRIVER' | 'RIDER';

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  verified: boolean;
}

export interface RideRequest {
  id: string;
  role: UserRole;
  origin: string;
  destination: string;
  time: string;
  status: 'PENDING' | 'MATCHING' | 'MATCHED' | 'COMPLETED';
}

export interface MatchCandidate {
  id: string;
  user: UserProfile;
  matchScore: number; // 0-100%
  detourMinutes: number;
  price?: number;
  role: UserRole;
  origin: string;
  destination: string;
  departureTime: string;
  departureDate?: string; // Optional date for community posts
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface RideHistoryItem {
  id: string;
  date: string;
  origin: string;
  destination: string;
  role: UserRole;
  price: number;
  driverName?: string;
  riderName?: string;
  status: 'COMPLETED' | 'CANCELLED' | 'UPCOMING';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';
  read: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'VISA' | 'MASTERCARD' | 'AMEX';
  last4: string;
  expiry: string; // MM/YY
  isDefault: boolean;
}