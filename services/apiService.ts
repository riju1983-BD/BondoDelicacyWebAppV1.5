
import { GoogleGenAI, Type } from "@google/genai";
import { User, Order, Reservation, CartItem, Brand, LoyaltyConfig, BrandData, BrandMenuCategory, DishRecommendation, ChatMessage, PartyLead, Complaint, RestaurantTable, DeliveryAddress } from '../types';
import { brandsData } from '../data';
import { supabase } from './supabaseClient';

// --- CONSTANTS & CONFIG ---
const PETPOOJA_CONFIG = {
    BASE_URL: 'https://api.petpooja.com/v1',
    API_KEY: 'YOUR_REAL_PETPOOJA_API_KEY',        
    APP_SECRET: 'YOUR_REAL_PETPOOJA_APP_SECRET',  
    ACCESS_TOKEN: 'YOUR_REAL_PETPOOJA_ACCESS_TOKEN' 
};

const STATIC_TABLE_INVENTORY: RestaurantTable[] = [
    { id: 't1', name: 'T1', capacity: 2, type: '2-seater' },
    { id: 't2', name: 'T2', capacity: 2, type: '2-seater' },
    { id: 't3', name: 'T3', capacity: 2, type: '2-seater' },
    { id: 't4', name: 'T4', capacity: 2, type: '2-seater' },
    { id: 't5', name: 'T5', capacity: 4, type: '4-seater' },
    { id: 't6', name: 'T6', capacity: 4, type: '4-seater' },
    { id: 't7', name: 'T7', capacity: 6, type: '6-seater' },
];

// --- Utils ---
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateOrderId = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}${month}${year}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `${dateString}-${randomPart}`;
};

const handleSupabaseError = (error: any, context: string) => {
    console.error(`[Supabase Error - ${context}]:`, error.message || error, error.details || '', error.hint || '');
    throw new Error(error.message || `An error occurred during ${context}`);
};


// --- Petpooja API Helper ---
const callPetpoojaAPI = async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
    return null; 
};


// --- Email Service ---
const sendEmail = async (to: string, subject: string, htmlContent: string, textContent: string) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return;
};


// --- API Functions ---
export const apiGetLoyaltyConfig = async (): Promise<LoyaltyConfig> => {
    const { data, error } = await supabase.from('loyalty_config').select('*').maybeSingle();
    if (error) {
        console.warn("Failed to fetch loyalty config from Supabase.", error.message);
        return { rupeesPerPoint: 100 }; 
    }
    if (!data) return { rupeesPerPoint: 100 };
    return { rupeesPerPoint: data.rupees_per_point };
};

export const apiSetLoyaltyConfig = async (config: LoyaltyConfig): Promise<LoyaltyConfig> => {
    const { error } = await supabase.from('loyalty_config').upsert({ id: 1, rupees_per_point: config.rupeesPerPoint });
    if (error) handleSupabaseError(error, 'Set Loyalty Config');
    return config;
};

export const applyFlatDiscount = (subtotal: number): { discountedTotal: number; discountAmount: number; discountPercentage: number } => {
    let discountPercentage = 0;
    if (subtotal > 2000) {
        discountPercentage = 0.25;
    } else if (subtotal >= 1000) {
        discountPercentage = 0.20;
    } else if (subtotal > 0) {
        discountPercentage = 0.15;
    }
    const discountAmount = subtotal * discountPercentage;
    const discountedTotal = subtotal - discountAmount;
    return { discountedTotal, discountAmount, discountPercentage };
};

export const apiGetUserValidPoints = async (userId: string): Promise<number> => {
    const { data, error } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).maybeSingle();
    if (error || !data || !data.loyalty_points) return 0;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const validPoints = (data.loyalty_points as any[]).filter((p: any) => new Date(p.earnedAt) >= oneYearAgo);
    return validPoints.reduce((acc: number, p: any) => acc + p.points, 0);
};


// --- Address API ---
export const apiGetUserAddresses = async (userId: string): Promise<DeliveryAddress[]> => {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false }) // Defaults first
        .order('created_at', { ascending: false }); // Then newest first

    if (error) {
        console.error("Error fetching addresses:", error);
        return [];
    }

    return (data || []).map((addr: any) => ({
        id: addr.id,
        fullAddress: addr.full_address,
        flatNo: addr.flat_no,
        landmark: addr.landmark,
        isDefault: addr.is_default,
        coordinates: (addr.lat && addr.lng) ? { lat: addr.lat, lng: addr.lng } : undefined
    }));
};

export const apiSaveUserAddress = async (userId: string, address: DeliveryAddress): Promise<DeliveryAddress> => {
    // If setting as default, unset others first
    if (address.isDefault) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const dbAddress = {
        user_id: userId,
        full_address: address.fullAddress,
        flat_no: address.flatNo,
        landmark: address.landmark,
        is_default: !!address.isDefault,
        lat: address.coordinates?.lat || null,
        lng: address.coordinates?.lng || null
    };

    const { data, error } = await supabase.from('addresses').insert(dbAddress).select().single();

    if (error) handleSupabaseError(error, 'Save Address');

    return {
        ...address,
        id: data.id,
        isDefault: data.is_default
    };
};


// --- User API ---
export const apiGetUserById = async (userId: string): Promise<User | null> => {
    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (profileError || !profile) return null;

    // 2. Check admin status
    const { data: adminRecord } = await supabase.from('admins').select('id').eq('id', userId).maybeSingle();
    const isAdmin = !!adminRecord || profile.is_admin === true;

    // 3. Fetch addresses
    const addresses = await apiGetUserAddresses(userId);

    return {
        id: profile.id,
        name: profile.name,
        email: profile.email || "", 
        phone: profile.phone,
        passwordHash: "", 
        isAdmin: isAdmin,
        loyaltyPoints: profile.loyalty_points || [],
        dob: profile.dob,
        anniversaryDate: profile.anniversary_date,
        dietaryPreferences: profile.dietary_preferences,
        addresses: addresses,
    };
}

export const apiUpdateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.dob) dbUpdates.dob = updates.dob;
    if (updates.anniversaryDate) dbUpdates.anniversary_date = updates.anniversaryDate;
    if (updates.dietaryPreferences) dbUpdates.dietary_preferences = updates.dietaryPreferences;
    // Address updates are now handled via apiSaveUserAddress, but we keep this for other profile fields

    if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
        if (error) handleSupabaseError(error, 'Update User');
    }
    
    return apiGetUserById(userId) as Promise<User>; 
};


// --- Order API ---
export const apiGetUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((o: any) => mapDbOrderToType(o));
};

const mapDbOrderToType = (dbOrder: any): Order => ({
    id: dbOrder.id,
    brandId: dbOrder.brand_id,
    userId: dbOrder.user_id,
    items: dbOrder.items,
    customer: dbOrder.customer,
    deliveryAddress: dbOrder.delivery_address,
    subtotal: dbOrder.subtotal,
    discountAmount: dbOrder.discount_amount,
    loyaltyDiscount: dbOrder.loyalty_discount,
    gstAmount: dbOrder.gst_amount,
    totalAmount: dbOrder.total_amount,
    pointsEarned: dbOrder.points_earned,
    createdAt: dbOrder.created_at,
    status: dbOrder.status,
    rating: dbOrder.rating,
    feedback: dbOrder.feedback,
    complaint: dbOrder.complaint, 
    refundStatus: dbOrder.refund_status,
    deliveryInfo: dbOrder.delivery_info,
    externalOrderId: dbOrder.external_order_id
});

export const apiGetOrderById = async (orderId: string): Promise<Order | undefined> => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error || !data) return undefined;
    return mapDbOrderToType(data);
}

export const apiCreateOrder = async (
    brandId: Brand['id'], 
    userId: string, 
    items: CartItem[], 
    customer: Order['customer'], 
    deliveryAddress: DeliveryAddress,
    subtotal: number, 
    loyaltyPointsToRedeem: number
): Promise<Order> => {
    const { discountedTotal, discountAmount } = applyFlatDiscount(subtotal);
    const totalBeforeGst = Math.max(0, discountedTotal - loyaltyPointsToRedeem);
    const gstAmount = totalBeforeGst * 0.05;
    const finalTotalAmount = totalBeforeGst + gstAmount;
    const config = await apiGetLoyaltyConfig();
    const pointsEarned = Math.floor(finalTotalAmount / config.rupeesPerPoint);
    const internalOrderId = generateOrderId();

    const newOrderData = {
        id: internalOrderId,
        brand_id: brandId,
        user_id: userId,
        items,
        customer,
        delivery_address: deliveryAddress,
        subtotal,
        discount_amount: discountAmount,
        loyalty_discount: loyaltyPointsToRedeem,
        gst_amount: gstAmount,
        total_amount: finalTotalAmount,
        points_earned: pointsEarned,
        status: 'received',
        created_at: new Date().toISOString(),
    };

    const { error: orderError } = await supabase.from('orders').insert(newOrderData);
    if (orderError) handleSupabaseError(orderError, 'Create Order');

    const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).single();
    let currentPoints = (profile?.loyalty_points as any[]) || [];
    if (pointsEarned > 0) currentPoints.push({ points: pointsEarned, earnedAt: new Date().toISOString() });
    await supabase.from('profiles').update({ loyalty_points: currentPoints }).eq('id', userId);

    return mapDbOrderToType(newOrderData);
};

export const apiUpdateOrder = async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;
    if (updates.complaint !== undefined) dbUpdates.complaint = updates.complaint;
    if (updates.refundStatus !== undefined) dbUpdates.refund_status = updates.refundStatus;
    if (updates.deliveryInfo !== undefined) dbUpdates.delivery_info = updates.deliveryInfo;
    const { data, error } = await supabase.from('orders').update(dbUpdates).eq('id', orderId).select().single();
    if (error) handleSupabaseError(error, 'Update Order');
    return mapDbOrderToType(data);
};

// --- Complaint & Refund API ---
export const apiRaiseComplaint = async (orderId: string, itemNames: string[], comments: string): Promise<Order> => {
    const order = await apiGetOrderById(orderId);
    if (!order) throw new Error("Order not found");
    const complaint: Complaint = {
        id: `C-${order.id}-${Math.floor(Math.random() * 1000)}`,
        itemNames,
        comments,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('orders').update({ complaint: complaint, refund_status: 'none' }).eq('id', orderId).select().single();
    if (error) handleSupabaseError(error, 'Raise Complaint');
    return mapDbOrderToType(data);
};

export const apiGetComplaints = async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').not('complaint', 'is', null).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(mapDbOrderToType);
};

export const apiProcessRefundApproval = async (orderId: string): Promise<Order> => {
    const order = await apiGetOrderById(orderId);
    if (!order || !order.complaint) throw new Error("Invalid order");
    const updatedComplaint = { ...order.complaint, status: 'approved', resolvedAt: new Date().toISOString() };
    const { data, error } = await supabase.from('orders').update({ complaint: updatedComplaint, refund_status: 'processed' }).eq('id', orderId).select().single();
    if (error) handleSupabaseError(error, 'Process Refund');
    return mapDbOrderToType(data);
};

export const apiRejectComplaint = async (orderId: string): Promise<Order> => {
     const order = await apiGetOrderById(orderId);
     if (!order || !order.complaint) throw new Error("Invalid order");
     const updatedComplaint = { ...order.complaint, status: 'rejected', resolvedAt: new Date().toISOString() };
     const { data, error } = await supabase.from('orders').update({ complaint: updatedComplaint }).eq('id', orderId).select().single();
     if (error) handleSupabaseError(error, 'Reject Complaint');
     return mapDbOrderToType(data);
};

// --- Reservation API ---
export const apiGetReservationById = async (resId: string): Promise<Reservation | undefined> => {
    const { data, error } = await supabase.from('reservations').select('*').eq('id', resId).maybeSingle();
    if (error || !data) return undefined;
    return mapDbReservation(data);
}

// Track by Phone or Booking ID - SHOW ACTIVE ONLY
export const apiTrackReservations = async (query: string): Promise<Reservation[]> => {
    const cleanQuery = query.trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
    const todayStr = new Date().toISOString().split('T')[0];

    // Base query: Filter for non-cancelled/expired statuses AND present/future dates
    let dbQuery = supabase.from('reservations')
        .select('*')
        .in('status', ['confirmed', 'pending']) // Only active statuses
        .gte('date', todayStr) // Only today or future dates
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    if (isUUID) {
        dbQuery = dbQuery.eq('id', cleanQuery);
    } else {
        dbQuery = dbQuery.or(`phone.eq.${cleanQuery},booking_id.eq.${cleanQuery.toUpperCase()}`);
    }

    const { data, error } = await dbQuery;
    if (error) {
        console.error("Error tracking reservation:", error);
        return [];
    }

    // Secondary JS filter for exact time (don't show reservations from earlier today that are passed)
    const now = new Date();
    const activeReservations = (data || []).map(mapDbReservation).filter(res => {
        const resDateTime = new Date(`${res.date}T${res.time}`);
        // Add 30 min buffer: it's still "active"/trackable if you are 30 mins late
        const expiryTime = new Date(resDateTime.getTime() + 30 * 60000);
        return now < expiryTime;
    });

    return activeReservations;
};

export const apiGetUserReservations = async (userId: string): Promise<Reservation[]> => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data, error } = await supabase.from('reservations').select('*').eq('user_id', userId).gte('date', sixMonthsAgo.toISOString().split('T')[0]).order('date', { ascending: false }).order('time', { ascending: false });
    if (error) return [];
    return (data || []).map(mapDbReservation);
}

// NEW: Get all active reservations for Admin
export const apiGetAllActiveReservations = async (): Promise<Reservation[]> => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .order('date', { ascending: true })
        .order('time', { ascending: true });
        
    if (error) {
        console.error("Error fetching active reservations:", error);
        return [];
    }
    return (data || []).map(mapDbReservation);
};

const mapDbReservation = (data: any): Reservation => ({
    id: data.id,
    bookingId: data.booking_id,
    brandId: data.brand_id,
    userId: data.user_id,
    tableId: data.table_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    date: data.date,
    time: data.time,
    guests: data.guests,
    requests: data.requests,
    createdAt: data.created_at,
    status: data.status as Reservation['status']
});

export const apiGetAvailableTables = async (brandId: string, date: string, time: string, guests: number): Promise<RestaurantTable[]> => {
    const capableTables = STATIC_TABLE_INVENTORY.filter(t => t.capacity >= guests);
    if (capableTables.length === 0) return [];
    const bestFitCapacity = Math.min(...capableTables.map(t => t.capacity));
    const suitableTables = capableTables.filter(t => t.capacity === bestFitCapacity);
    try {
        // Direct Supabase query instead of RPC for simpler setup
        const { data: occupied, error } = await supabase
            .from('reservations')
            .select('table_id, time')
            .eq('brand_id', brandId)
            .eq('date', date)
            .in('status', ['confirmed', 'pending']);

        if (error) throw error;

        // Simple time conflict check (occupies table for 60 mins)
        const reqTimeVal = parseInt(time.replace(':', ''));
        const blockedTableIds = new Set<string>();
        
        if (occupied && Array.isArray(occupied)) {
            occupied.forEach((res: any) => {
                const resTimeVal = parseInt(res.time.replace(':', ''));
                 // Block if within 60 minutes of another booking
                 if (Math.abs(reqTimeVal - resTimeVal) < 60) {
                     blockedTableIds.add(res.table_id);
                }
            });
        }
        
        return suitableTables.filter(t => !blockedTableIds.has(t.id));
    } catch (e) {
        console.error("Error checking table availability:", e);
        // Fallback: return all suitable tables if DB check fails (e.g. network error)
        return suitableTables; 
    }
};

export const apiSendReservationOTP = async (contact: string): Promise<boolean> => {
    await simulateDelay(1000);
    console.log(`[MOCK OTP] Sent 1234 to ${contact}`);
    return true;
};

export const apiVerifyReservationOTP = async (contact: string, otp: string): Promise<boolean> => {
    await simulateDelay(500);
    return otp === '1234';
};

const generateDailyBookingId = async (dateStr: string): Promise<string> => {
    const datePart = dateStr.replace(/-/g, '');
    
    // Find the highest current booking_id for today
    const { data } = await supabase
        .from('reservations')
        .select('booking_id')
        .eq('date', dateStr)
        .not('booking_id', 'is', null)
        // Ordering by booking_id descending gets us the latest one because of the fixed-width format
        .order('booking_id', { ascending: false })
        .limit(1)
        .maybeSingle();

    let nextNum = 1;
    if (data?.booking_id) {
        const parts = data.booking_id.split('-');
        // Expecting format B-YYYYMMDD-XX. We want the last part.
        const lastPart = parts[parts.length - 1];
        const lastNum = parseInt(lastPart, 10);
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }

    return `B-${datePart}-${nextNum.toString().padStart(2, '0')}`;
};

export const apiCreateReservation = async (
    brandId: Brand['id'],
    userId: string | undefined,
    form: { name: string; email: string; phone: string; date: string; time: string; guests: number; requests: string; tableId?: string }
): Promise<Reservation> => {
    const cleanPhone = form.phone.trim();

    // (Duplicate check removed in previous step as per instructions, keeping it removed)

    let finalUserId = userId || null;
    if (!finalUserId && cleanPhone) {
        const { data: userProfile } = await supabase.from('profiles').select('id').eq('phone', cleanPhone).maybeSingle();
        if (userProfile) finalUserId = userProfile.id;
    }

    const bookingId = await generateDailyBookingId(form.date);
    const newReservation = {
        booking_id: bookingId,
        brand_id: brandId,
        user_id: finalUserId,
        table_id: form.tableId || null,
        name: form.name,
        email: form.email,
        phone: cleanPhone,
        date: form.date,
        time: form.time,
        guests: form.guests,
        requests: form.requests,
        status: 'confirmed'
    };
    
    const { data, error } = await supabase.from('reservations').insert(newReservation).select().single();
    
    if (error) {
        if (error.code === '23505') {
             throw new Error("This slot was just booked by someone else. Please try another time.");
        }
        handleSupabaseError(error, 'Create Reservation');
    }

    // Ensure we return the booking_id we just generated, even if the DB select didn't return it immediately
    // (This handles cases where RLS might hide the new row from the immediate select)
    return mapDbReservation({ ...data, booking_id: bookingId });
};

export const apiUpdateReservation = async (resId: string, updates: Partial<Reservation>): Promise<Reservation> => {
     const { data, error } = await supabase.from('reservations').update(updates).eq('id', resId).select().single();
     if (error) handleSupabaseError(error, 'Update Reservation');
     return mapDbReservation(data);
};

// --- Menu & Other ---
const saveMenuToStorage = (brandId: Brand['id'], menu: BrandMenuCategory[]) => {
    localStorage.setItem(`petpooja-menu-${brandId}`, JSON.stringify(menu));
};
const getMenuFromStorage = (brandId: Brand['id']): BrandMenuCategory[] | null => {
    const storedMenu = localStorage.getItem(`petpooja-menu-${brandId}`);
    return storedMenu ? JSON.parse(storedMenu) : null;
};

export const apiGetLiveMenu = async (brandId: Brand['id']): Promise<BrandMenuCategory[]> => {
    return getMenuFromStorage(brandId) || brandsData[brandId].menu;
};
export const apiUpdateItemAvailability = async (brandId: Brand['id'], itemName: string, isAvailable: boolean): Promise<boolean> => {
    const menu = await apiGetLiveMenu(brandId);
    const newMenu = menu.map(category => ({
        ...category,
        items: category.items.map(item => item.name === itemName ? { ...item, isAvailable } : item)
    }));
    saveMenuToStorage(brandId, newMenu);
    return true;
};
export const apiGetBrandDetails = (brandId: string): BrandData | undefined => {
    // @ts-ignore
    return brandsData[brandId];
};
export const apiGetAllBrands = (): Brand[] => {
    return Object.values(brandsData).map(b => ({ id: b.id, name: b.name, description: b.tagline, logo: b.logo, petpoojaRestId: b.petpoojaRestId }));
};
export const apiPunchOrder = async (order: Order): Promise<{ success: boolean; message: string }> => { return { success: true, message: "Order processing initiated." }; };
export const apiBookDelivery = async (orderId: string): Promise<boolean> => {
    await simulateDelay(2000); 
    const mockRider = { riderName: "Rajesh Kumar", riderPhone: "9876543210", etaMinutes: 25 };
    await apiUpdateOrder(orderId, { deliveryInfo: mockRider });
    return true;
};
export const apiGetDishRecommendation = async (user: User, brandId: Brand['id']): Promise<DishRecommendation> => {
     if (!process.env.API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandName = brandsData[brandId]?.name || 'our restaurant';
    const menu = brandsData[brandId].menu; 
    const simplifiedMenu = menu.flatMap(cat => cat.items.map(item => item.name)).join(', ');
    const userOrders = await apiGetUserOrders(user.id);
    const orderHistory = userOrders.slice(0, 5).map(order => ({
        items: order.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
        rating: order.rating ? `${order.rating}/5 stars` : 'Not rated',
        date: new Date(order.createdAt).toLocaleDateString()
    }));
    const prompt = `You are an expert restaurant concierge for ${brandName}. Recommend ONE dish based on this profile: Name: ${user.name}, Preferences: Likes: ${user.dietaryPreferences?.likes}, Dislikes: ${user.dietaryPreferences?.dislikes}, Allergies: ${user.dietaryPreferences?.allergies}. Recent Orders: ${JSON.stringify(orderHistory)}. Menu: ${simplifiedMenu}. Return JSON: { "dishName": "", "reason": "", "offer": "(optional if special day)" }`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text.trim());
};
export const apiHelpBuddyChat = async (history: {role: string, parts: string}[], message: string): Promise<{role: "model", parts: string}> => {
      return { role: "model", parts: "I'm a mock AI buddy. I can't truly chat yet without more backend setup!" };
};
