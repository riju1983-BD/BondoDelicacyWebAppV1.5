
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { apiGetUserById } from '../services/apiService';

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

  const register = async (name: string, email: string, phone: string, password: string, dob?: string, dietaryPreferences?: User['dietaryPreferences']): Promise<void> => {
     const { data, error: signUpError } = await supabase.auth.signUp({
         email,
         password,
         options: {
             data: { name, phone } 
         }
     });

     if (signUpError) throw signUpError;
     if (!data.user) throw new Error("Registration failed.");

     // If we have an active session immediately, try to update extra fields.
     if (data.session && (dob || dietaryPreferences)) {
         // Give the trigger a moment to fire first, then update
         setTimeout(async () => {
             await supabase.from('profiles').update({
                 dob: dob || null,
                 dietary_preferences: dietaryPreferences || {},
             }).eq('id', data.user!.id);
         }, 1500);
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
