import { ItemData } from "./model/menu_list";

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
  items: ItemData[];
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
  name: string;
  capacity: number;
  _status: "available" | "booked";
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

export interface CartItem extends ItemData {
  quantity: number;
}
export type Restaurant = {
  rest_id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;

  logo?: string | null;
  hero_image?: string | null;

  about_text?: string | null;
  about_image?: string | null;

  theme_primary?: string | null;
  theme_accent?: string | null;
  theme_text_on_primary?: string | null;
};

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
  totalAmount: number;
}

export interface Order {
  id: string;
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
  status: 'Order Placed' | 'Accepted' | 'Food Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';

  rating?: number;
  feedback?: string;
  complaint?: Complaint;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  deliveryInfo?: DeliveryInfo;
  externalOrderId?: string; // To store Petpooja's order ID
}


export interface Brand {
  id: 'c9ignw2k50' | 'niraamish' | 'daily-box' | 'teretti';
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
  role: 'user' | 'bot' | 'model';
  content: string;
  timestamp?: string; // ✅ Add this line
  metadata?: {
    categoriesCount?: number;
    itemsCount?: number;
    error?: boolean;
  };
}
