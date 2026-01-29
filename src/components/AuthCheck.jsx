// src/components/AuthCheck.jsx - FIXED VERSION
import React, { useEffect, useState, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useLocation } from 'react-router-dom';

const AuthCheck = ({ children }) => {
    const { getCurrentUser, getSession } = useSupabase();
    const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'
    const hasChecked = useRef(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const location = useLocation(); // Get current location

    useEffect(() => {
        // Skip if we've already checked
        if (hasChecked.current) return;

        const verifyAuth = async () => {
            try {
                console.log('AuthCheck - Initial authentication check...');
                console.log('Current path:', location.pathname);

                // Give a small delay for Supabase to establish session after login
                if (location.pathname === '/login') {
                    console.log('On login page, adding extra delay...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Try to get current user
                const user = await getCurrentUser();
                console.log('AuthCheck - getCurrentUser result:', user ? 'User found' : 'No user');

                if (user) {
                    console.log('✅ AuthCheck - User authenticated:', user.email);
                    setAuthStatus('authenticated');
                    hasChecked.current = true;
                    setHasLoaded(true);
                    return;
                }

                // Try to get session
                const session = await getSession();
                console.log('AuthCheck - getSession result:', session ? 'Session found' : 'No session');

                if (session) {
                    console.log('✅ AuthCheck - Session found:', session.user.email);
                    setAuthStatus('authenticated');
                    hasChecked.current = true;
                    setHasLoaded(true);
                    return;
                }

                // If we get here, no auth found
                console.log('❌ AuthCheck - No authentication found');
                setAuthStatus('unauthenticated');
                hasChecked.current = true;
                setHasLoaded(true);

            } catch (error) {
                console.error('❌ AuthCheck - Error:', error);
                setAuthStatus('unauthenticated');
                hasChecked.current = true;
                setHasLoaded(true);
            }
        };

        verifyAuth();
    }, [getCurrentUser, getSession, location.pathname]);

    // Reset check when location changes (for login/logout)
    useEffect(() => {
        // When path changes to login, reset the check
        if (location.pathname === '/login') {
            console.log('Reset auth check for login page');
            hasChecked.current = false;
            setHasLoaded(false);
            setAuthStatus('checking');
        }
    }, [location.pathname]);

    // Add visibility change handler to prevent re-checks
    useEffect(() => {
        const handleVisibilityChange = () => {
            // When tab becomes visible again, don't re-check auth
            // Just log it for debugging
            if (document.visibilityState === 'visible') {
                console.log('📱 Tab became visible - skipping auth re-check');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Show loading only on initial load
    if (!hasLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold mb-2">Loading Mount</h2>
                    <p className="opacity-80">Please wait...</p>
                </div>
            </div>
        );
    }

    // If unauthenticated but in a protected route, show login prompt
    if (authStatus === 'unauthenticated') {
        const isProtectedRoute = !['/', '/login'].includes(location.pathname);

        console.log('AuthCheck - Checking if protected route:', {
            pathname: location.pathname,
            isProtectedRoute,
            authStatus
        });

        if (isProtectedRoute) {
            console.log('AuthCheck - Showing login prompt for protected route');
            return (
                <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
                    <div className="text-center text-white max-w-md p-8">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Please Login</h2>
                        <p className="mb-6 opacity-90">You need to login to access this page.</p>
                        <button
                            onClick={() => {
                                window.location.href = '/login?redirect=' + encodeURIComponent(location.pathname);
                            }}
                            className="bg-white text-naijaGreen font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Login
                        </button>
                    </div>
                </div>
            );
        }
    }

    // If authenticated or on public route, show children
    console.log('AuthCheck - Rendering children, authStatus:', authStatus);
    return children;
};

export default AuthCheck;