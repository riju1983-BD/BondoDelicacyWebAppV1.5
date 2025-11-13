
import { createClient } from '@supabase/supabase-js';

// =====================================================================
// ⚠️ CRITICAL DATABASE SETUP REQUIRED ⚠️
// =====================================================================
// You must run the following SQL in your Supabase Dashboard SQL Editor
// to fix the "Could not find the 'delivery_address' column" error:
//
// ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address jsonb;
//
// =====================================================================

// =====================================================================
// ⚠️ CRITICAL: YOU MUST REPLACE THESE PLACEHOLDERS WITH YOUR REAL KEYS
// =====================================================================
// 1. Go to your Supabase Dashboard -> Project Settings -> API
// 2. Copy "Project URL" and "anon" public key.
const SUPABASE_URL = 'https://nldgaczpzfmwamivniua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZGdhY3pwemZtd2FtaXZuaXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjcwOTUsImV4cCI6MjA3ODIwMzA5NX0.NfduTZaE1s73_DLvaTKSu53xmnFBQf559umXTFD4okk'

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
