// src/components/AuthCheck.jsx - UPDATED (handles Google OAuth incomplete profiles)
import React, { useEffect, useState, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCheck = ({ children }) => {
    const { getCurrentUser, getSession, supabase } = useSupabase();
    const [authStatus, setAuthStatus] = useState('checking');
    const hasChecked = useRef(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (hasChecked.current) return;

        const verifyAuth = async () => {
            try {
                console.log('AuthCheck - Initial authentication check...');
                console.log('Current path:', location.pathname);

                if (location.pathname === '/app/login') {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const user = await getCurrentUser();

                if (!user) {
                    const session = await getSession();
                    if (!session) {
                        console.log('❌ AuthCheck - No authentication found');
                        setAuthStatus('unauthenticated');
                        hasChecked.current = true;
                        setHasLoaded(true);
                        return;
                    }
                }

                const authedUser = user || (await getSession())?.user;
                console.log('✅ AuthCheck - User authenticated:', authedUser?.email);

                // ── NEW: Check for incomplete OAuth profile ──────────────────────
                // Only run this check on protected routes, not on /complete-profile itself
                const isCompletingProfile = location.pathname === '/complete-profile';

                if (!isCompletingProfile && authedUser) {
                    const { data: customerRow } = await supabase
                        .from('customers')
                        .select('id')
                        .eq('id', authedUser.id)
                        .maybeSingle();  // maybeSingle won't throw if no row found

                    if (!customerRow) {
                        // Also check if this user is a company or admin - if so, skip redirect
                        const { data: profileRow } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', authedUser.id)
                            .maybeSingle();

                        const role = profileRow?.role;

                        if (!role || role === 'customer') {
                            // No customers record + customer/no role = incomplete OAuth signup
                            console.log('⚠️ AuthCheck - No customers record found, redirecting to complete-profile');
                            hasChecked.current = true;
                            setHasLoaded(true);
                            setAuthStatus('authenticated');
                            navigate('/complete-profile', { replace: true });
                            return;
                        }
                    }
                }
                // ── END NEW ───────────────────────────────────────────────────────

                setAuthStatus('authenticated');
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
    }, [getCurrentUser, getSession, supabase, location.pathname, navigate]);

    // Reset check on login/welcome page navigation
    useEffect(() => {
        if (location.pathname === '/app/login' || location.pathname === '/app') {
            console.log('Reset auth check for app login/welcome page');
            hasChecked.current = false;
            setHasLoaded(false);
            setAuthStatus('checking');
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('📱 Tab became visible - skipping auth re-check');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

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

    if (authStatus === 'unauthenticated') {
        const publicRoutes = [
            '/',
            '/app',
            '/app/login',
            '/services',
            '/how-it-works',
            '/for-customers',
            '/for-providers',
            '/contact',
            '/locations',
            '/complete-profile'   // Allow unauthenticated access for edge cases
        ];

        const isPublicRoute = publicRoutes.some(route =>
            location.pathname === route || location.pathname.startsWith(route + '/')
        );

        if (!isPublicRoute) {
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
                                window.location.href = '/app/login?redirect=' + encodeURIComponent(location.pathname);
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

    return children;
};

export default AuthCheck;