// src/context/SupabaseContext.jsx - FIXED VERSION
import React, { createContext, useContext, useEffect, useState } from 'react'; // ADD React import
import { createClient } from '@supabase/supabase-js';

const SupabaseContext = createContext();

// ============================================
// YOUR PROJECT KEYS
// ============================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== SUPABASE INITIALIZATION ===');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 20 chars):', SUPABASE_KEY.substring(0, 20) + '...');

// Create client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

// Session recovery function
const checkAndRecoverSession = async () => {
    try {
        console.log('Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session check error:', error);
            return null;
        }

        if (!session) {
            console.log('No session found, trying to refresh...');
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error('Session refresh error:', refreshError);
                return null;
            }

            console.log('Session refreshed:', newSession?.user?.email);
            return newSession;
        }

        console.log('Session found for:', session.user.email);
        return session;
    } catch (error) {
        console.error('Session recovery error:', error);
        return null;
    }
};

// Helper functions
const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Get user error:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

const getSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Get session error:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.supabase = supabase;
    console.log('Supabase added to window object');
    console.log('Window.supabase URL:', window.supabase.supabaseUrl);
}

export function SupabaseProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Memoize these functions so they don't change on every render
    const memoizedGetCurrentUser = React.useCallback(async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                console.error('Get user error:', error);
                return null;
            }

            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }, []);

    const memoizedGetSession = React.useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Get session error:', error);
                return null;
            }

            return session;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        console.log('SupabaseProvider mounting...');

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('Initial session:', session?.user?.email);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(error => {
            console.error('Session error:', error);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event, session?.user?.email);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            console.log('SupabaseProvider unmounting');
            subscription.unsubscribe();
        };
    }, []);

    const signUp = React.useCallback((email, password, metadata = {}) => {
        console.log('SignUp called:', email);
        return supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: window.location.origin + '/dashboard'
            }
        });
    }, []);

    const signIn = React.useCallback((email, password) => {
        console.log('SignIn called:', email);
        return supabase.auth.signInWithPassword({ email, password });
    }, []);

    const signOut = React.useCallback(() => {
        console.log('SignOut called');
        supabase.auth.signOut().then(() => {
            window.location.href = '/';
        });
    }, []);

    return (
        <SupabaseContext.Provider value={{
            user,
            loading,
            supabase,
            signUp,
            signIn,
            signOut,
            getCurrentUser: memoizedGetCurrentUser,
            getSession: memoizedGetSession
        }}>
            {children}
        </SupabaseContext.Provider>
    );
}

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within SupabaseProvider');
    }
    return context;
};

export { supabase };