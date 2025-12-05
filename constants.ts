
import { MatchCandidate, RideHistoryItem, UserProfile, NotificationItem, PaymentMethod } from './types';

export const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE3M2VhY2U1ZDY0NjQ4Y2M4ZDI0YTY0MzE4NThmNmIxIiwiaCI6Im11cm11cjY0In0=";

// Coordinates for the demo (Bay Area approximation)
export const LOCATION_COORDINATES: Record<string, [number, number]> = {
  "Tech Park Campus": [37.3916, -122.0494], // Sunnyvale
  "University Main Gate": [37.4275, -122.1697], // Stanford
  "Downtown Metro": [37.7749, -122.4194], // SF
  "Central Station": [37.3382, -121.8863], // San Jose
  "Westside Apartments": [37.7569, -122.4798], // Inner Sunset
  "North Hills Mall": [37.5682, -122.3255] // San Mateo
};

export const MOCK_USER: UserProfile = {
  id: 'me',
  name: 'Agam Kundu',
  avatarUrl: 'https://ui-avatars.com/api/?name=Agam+Kundu&background=0D8ABC&color=fff',
  rating: 4.9,
  verified: true
};

// Drivers available for Riders
export const MOCK_DRIVERS: MatchCandidate[] = [
  {
    id: 'm1',
    user: {
      id: 'u1',
      name: 'Sarah Jenkins',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
      rating: 4.8,
      verified: true
    },
    matchScore: 94,
    detourMinutes: 3,
    price: 4.50,
    role: 'DRIVER',
    origin: 'Downtown Metro',
    destination: 'Tech Park Campus',
    departureTime: '08:45 AM'
  },
  {
    id: 'm2',
    user: {
      id: 'u2',
      name: 'David Chen',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      rating: 4.5,
      verified: true
    },
    matchScore: 82,
    detourMinutes: 8,
    price: 3.00,
    role: 'DRIVER',
    origin: 'Westside Apts',
    destination: 'University Main Gate',
    departureTime: '09:00 AM'
  }
];

// Passengers available for Drivers
export const MOCK_PASSENGERS: MatchCandidate[] = [
  {
    id: 'p1',
    user: {
      id: 'u3',
      name: 'Emily Davis',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      rating: 4.9,
      verified: true
    },
    matchScore: 98,
    detourMinutes: 2,
    role: 'RIDER',
    origin: 'Downtown Metro',
    destination: 'Tech Park Campus',
    departureTime: '08:40 AM'
  },
  {
    id: 'p2',
    user: {
      id: 'u4',
      name: 'Michael Scott',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
      rating: 4.2,
      verified: true
    },
    matchScore: 75,
    detourMinutes: 10,
    role: 'RIDER',
    origin: 'Central Station',
    destination: 'North Hills Mall',
    departureTime: '08:50 AM'
  }
];

// Late arriving match for real-time simulation
export const MOCK_NEW_DRIVER_MATCH: MatchCandidate = {
  id: 'm-new',
  user: {
    id: 'u-new',
    name: 'Alex Rivera',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    rating: 5.0,
    verified: true
  },
  matchScore: 99,
  detourMinutes: 0,
  price: 4.00,
  role: 'DRIVER',
  origin: 'Nearby St.',
  destination: 'Tech Park Campus',
  departureTime: '08:50 AM'
};

export const MOCK_NEW_RIDER_MATCH: MatchCandidate = {
  id: 'p-new',
  user: {
    id: 'u-new-r',
    name: 'Lisa Wong',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    rating: 4.8,
    verified: true
  },
  matchScore: 96,
  detourMinutes: 1,
  role: 'RIDER',
  origin: 'Downtown Metro',
  destination: 'Tech Park Campus',
  departureTime: '08:42 AM'
};

export const MOCK_RIDE_HISTORY: RideHistoryItem[] = [
  {
    id: 'h1',
    date: 'Oct 24, 2023 • 08:30 AM',
    origin: 'Westside Apts',
    destination: 'University Main Gate',
    role: 'RIDER',
    price: 3.50,
    driverName: 'David Chen',
    status: 'COMPLETED'
  },
  {
    id: 'h2',
    date: 'Oct 22, 2023 • 05:15 PM',
    origin: 'University Main Gate',
    destination: 'Westside Apts',
    role: 'RIDER',
    price: 3.50,
    driverName: 'Sarah Jenkins',
    status: 'COMPLETED'
  },
  {
    id: 'h3',
    date: 'Oct 20, 2023 • 09:00 AM',
    origin: 'Downtown Metro',
    destination: 'Tech Park Campus',
    role: 'DRIVER',
    price: 5.00,
    riderName: 'Mike Ross',
    status: 'CANCELLED'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Ride Confirmed',
    message: 'Your ride with Sarah Jenkins has been confirmed for tomorrow at 8:45 AM.',
    time: '2 hours ago',
    type: 'SUCCESS',
    read: false
  },
  {
    id: 'n2',
    title: 'New Feature Available',
    message: 'You can now view detailed receipts for all your past trips in the History tab.',
    time: '1 day ago',
    type: 'INFO',
    read: true
  },
  {
    id: 'n3',
    title: 'Payment Successful',
    message: 'Payment of $3.50 for your trip to University Main Gate was successful.',
    time: '2 days ago',
    type: 'SUCCESS',
    read: true
  },
  {
    id: 'n4',
    title: 'Complete your profile',
    message: 'Add a profile picture to increase your matching chances by 20%!',
    time: '5 days ago',
    type: 'WARNING',
    read: true
  }
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm1',
    type: 'VISA',
    last4: '4242',
    expiry: '12/24',
    isDefault: true
  },
  {
    id: 'pm2',
    type: 'MASTERCARD',
    last4: '8888',
    expiry: '09/25',
    isDefault: false
  }
];

export const SUGGESTED_LOCATIONS = [
  "Tech Park Campus",
  "University Main Gate",
  "Downtown Metro",
  "Central Station",
  "Westside Apartments",
  "North Hills Mall"
];