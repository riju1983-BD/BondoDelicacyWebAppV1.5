
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { apiCheckUserExists, apiGetUserById } from '../services/apiService';

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string) => Promise<User>;
    register: (name: string, email: string, phone: string, password: string, dob?: string, dietaryPreferences?: User['dietaryPreferences']) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    refreshCurrentUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile data from our 'profiles' table
    const fetchProfile = async (userId: string, email: string) => {
        try {
            const userProfile = await apiGetUserById(userId);
            if (userProfile) {
                // Merge auth data (email) with profile data
                setCurrentUser({ ...userProfile, email });
            } else {
                // Profile missing. Try to create it on the fly (Fail-safe).
                console.warn("Profile missing. Attempting fail-safe creation...");
                const { error } = await supabase.from('profiles').insert([
                    { id: userId, email: email, name: 'Valued Customer' }
                ]);

                if (!error) {
                    // Successfully created, try fetching again
                    const retryProfile = await apiGetUserById(userId);
                    if (retryProfile) {
                        setCurrentUser({ ...retryProfile, email });
                        return;
                    }
                }

                // Ultimate fallback if even manual insert fails (e.g. RLS issue)
                console.error("Fail-safe profile creation failed:", error?.message);
                setCurrentUser({
                    id: userId,
                    email: email,
                    name: 'Valued Customer',
                    phone: '',
                    passwordHash: '',
                });
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // 1. Check active session on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setIsLoading(false);
            }
        });

        // 2. Listen for changes (login, logout, auto-refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                // Only fetch if we don't have it or it changed
                if (!currentUser || currentUser.id !== session.user.id) {
                    // Don't set isLoading(true) here to avoid flashing loading screens on minor session refreshes
                    fetchProfile(session.user.id, session.user.email!);
                }
            } else {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user || !data.user.email) throw new Error("Login succeeded but no user data returned.");

        // Attempt to fetch profile
        let profile = await apiGetUserById(data.user.id);

        // Fail-safe: If profile doesn't exist after login, create it manually now.
        if (!profile) {
            console.warn("User logged in but has no profile. Creating one now.");
            const { error: insertError } = await supabase.from('profiles').insert([{
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'Valued Customer',
                phone: data.user.user_metadata?.phone || ''
            }]);

            if (insertError) {
                console.error("Failed to create fail-safe profile:", insertError.message);
            } else {
                // Profile created, fetch it again
                profile = await apiGetUserById(data.user.id);
            }
        }

        if (!profile) {
            // Fallback return if profile is absolutely completely broken
            return {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'User',
                phone: '',
                passwordHash: '',
            };
        }

        const fullUser = { ...profile, email: data.user.email };
        setCurrentUser(fullUser);
        return fullUser;
    };

    const register = async (

        name: string,
        email: string,
        phone: string,
        password: string,
        dob?: string,
        dietaryPreferences?: User['dietaryPreferences']
    ): Promise<{ needsEmailConfirmation: boolean }> => {
        try {
            // ✅ CRITICAL: Check database FIRST before hitting Supabase Auth
            console.log('🔍 Checking if user exists...');
            const existingCheck = await apiCheckUserExists(email, phone);

            if (existingCheck.exists) {
                console.log(`❌ User already exists (${existingCheck.field})`);
                throw new Error(existingCheck.message);
            }

            console.log('✅ No existing user found, proceeding with registration');
            await supabase.auth.signOut();
            // ✅ Sign up with Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/#account`,
                    data: {
                        name,
                        phone
                    }
                }
            });

            console.log('🔍 SignUp Response:', {
                hasUser: !!data.user,
                hasSession: !!data.session,
                identitiesLength: data.user?.identities?.length,
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered') ||
                    signUpError.message.includes('already been registered') ||
                    signUpError.message.includes('User already registered')) {
                    throw new Error('This email is already registered. Please login instead.');
                }
                if (signUpError.message.includes('Password should be')) {
                    throw new Error('Password must be at least 6 characters long.');
                }
                throw new Error(signUpError.message || 'Registration failed. Please try again.');
            }

            if (!data.user) {
                throw new Error("Registration failed. Please try again.");
            }

            // Double-check identities (Supabase security feature)
            const hasIdentities = data.user.identities && data.user.identities.length > 0;

            if (!hasIdentities) {
                throw new Error('This email is already registered. Please login instead.');
            }

            // Check if email confirmation is required
            const needsEmailConfirmation = !data.session;

            // Update profile with additional data
            const updateProfile = async (retries = 5) => {
                for (let i = 0; i < retries; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));

                    const safeDiet = {
                        likes: Array.isArray(dietaryPreferences?.likes) ? dietaryPreferences.likes : [],
                        dislikes: Array.isArray(dietaryPreferences?.dislikes) ? dietaryPreferences.dislikes : [],
                        allergies: Array.isArray(dietaryPreferences?.allergies) ? dietaryPreferences.allergies : [],
                    };

                    const { error } = await supabase
                        .from("profiles")
                        .update({
                            dob: dob || null,
                            dietary_preferences: safeDiet
                        })
                        .eq("id", data.user.id);

                    if (!error) {
                        console.log("✅ Profile updated successfully");
                        return true;
                    }

                    if (error.code !== 'PGRST116') {
                        console.error("❌ Profile update failed:", error);
                        return false;
                    }

                    console.log(`⏳ Profile not ready yet, retry ${i + 1}/${retries}...`);
                }
                console.warn("⚠️ Profile update timed out");
                return false;
            };

            updateProfile().catch(console.error);

            return { needsEmailConfirmation };

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };


    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.hash = '';
    };

    const refreshCurrentUser = async () => {
        if (currentUser) {
            await fetchProfile(currentUser.id, currentUser.email);
        }
    };

    const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);

    const value = {
        currentUser,
        login,
        register,
        logout,
        isAuthenticated,
        refreshCurrentUser,
        isLoading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
