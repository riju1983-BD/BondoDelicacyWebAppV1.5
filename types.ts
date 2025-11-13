
export interface MenuItem {
  id?: string; // Internal or external ID
  name: string;
  description: string;
  price: string;
  image: string;
  isAvailable: boolean;
  externalItemId?: string; // For Petpooja Item ID mapping
}

export interface BrandMenuCategory {
  category: string;
  items: MenuItem[];
}

export interface LoyaltyConfig {
  rupeesPerPoint: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  isAdmin?: boolean;
  loyaltyPoints?: { points: number; earnedAt: string }[];
  dob?: string;
  anniversaryDate?: string;
  dietaryPreferences?: {
    likes?: string;
    dislikes?: string;
    allergies?: string;
  };
  addresses?: DeliveryAddress[];
}

export interface RestaurantTable {
    id: string;
    name: string; // e.g., "T1", "Table 5"
    capacity: number;
    type: '2-seater' | '4-seater' | '6-seater';
}

export interface Reservation {
  id: string;
  bookingId: string;
  brandId: string;
  userId?: string;
  tableId?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  requests: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface DeliveryInfo {
  riderName: string;
  riderPhone: string;
  etaMinutes: number;
}

export interface DeliveryAddress {
  id?: string;
  fullAddress: string;
  flatNo: string;
  landmark: string;
  coordinates?: {
      lat: number;
      lng: number;
  };
  isDefault?: boolean;
}

export interface Complaint {
  id: string;
  itemNames: string[];
  comments: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface Order {
  id:string;
  brandId: Brand['id'];
  userId: string;
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress?: DeliveryAddress;
  subtotal: number;
  discountAmount?: number;
  loyaltyDiscount?: number;
  gstAmount?: number;
  totalAmount: number;
  pointsEarned?: number;
  createdAt: string;
  status: 'received' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  rating?: number;
  feedback?: string;
  complaint?: Complaint;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  deliveryInfo?: DeliveryInfo;
  externalOrderId?: string; // To store Petpooja's order ID
}


export interface Brand {
  id: 'bjale-jhole' | 'niraamish' | 'daily-box' | 'teretti';
  name: string;
  description: string;
  logo: string;
  petpoojaRestId?: string; // Added for API mapping
}

export interface BrandData extends Brand {
  tagline: string;
  heroImage: string;
  aboutText: string;
  aboutImage: string;
  menu: BrandMenuCategory[]; // This is now just a fallback
  gallery: string[];
  contactInfo: {
    address: string;
    phone: string;
    hours: string;
  };
  theme: {
    primary: string;
    accent: string;
    textOnPrimary: string;
  };
}

export interface PredictionResult {
  spoilageDate: string;
  reasoning: string;
}

export interface DishRecommendation {
    dishName: string;
    reason: string;
    offer?: string;
}

export interface PartyLead {
  id: string;
  headcount: number;
  eventDate: string;
  eventTime: string;
  location: string;
  menu: string;
  contactNumber: string;
  quoteAmount?: number;
  status: 'pending-quote' | 'quoted' | 'accepted' | 'declined';
  declineReason?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  quote?: PartyLead;
  isQuoteActioned?: boolean;
}
