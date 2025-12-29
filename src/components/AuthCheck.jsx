import React, { useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';

const AuthCheck = ({ children }) => {
    const { getCurrentUser, getSession } = useSupabase();
    const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Skip checking if already checking
        if (isChecking) return;

        const verifyAuth = async () => {
            setIsChecking(true);

            try {
                console.log('AuthCheck - Verifying authentication...');

                // Try to get current user
                const user = await getCurrentUser();

                if (user) {
                    console.log('✅ AuthCheck - User authenticated:', user.email);
                    setAuthStatus('authenticated');
                    setIsChecking(false);
                    return;
                }

                // Try to get session
                const session = await getSession();

                if (session) {
                    console.log('✅ AuthCheck - Session found:', session.user.email);
                    setAuthStatus('authenticated');
                    setIsChecking(false);
                    return;
                }

                // If we get here, no auth found
                console.log('❌ AuthCheck - No authentication found');
                setAuthStatus('unauthenticated');
                setIsChecking(false);

            } catch (error) {
                console.error('❌ AuthCheck - Error:', error);
                setAuthStatus('unauthenticated');
                setIsChecking(false);
            }
        };

        verifyAuth();

        // Cleanup function
        return () => {
            setIsChecking(false);
        };
    }, [getCurrentUser, getSession]); // Removed retryCount from dependencies

    // Show loading while checking (only on initial load)
    if (authStatus === 'checking') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold mb-2">Checking Authentication</h2>
                    <p className="opacity-80">Securing your session...</p>
                </div>
            </div>
        );
    }

    // If unauthenticated but in a protected route, show login prompt
    if (authStatus === 'unauthenticated') {
        const isProtectedRoute = !['/', '/login'].includes(window.location.pathname);

        if (isProtectedRoute) {
            // Don't auto-redirect immediately, let user see the message
            return (
                <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
                    <div className="text-center text-white max-w-md p-8">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Session Expired</h2>
                        <p className="mb-6 opacity-90">Your session has expired. Please login again.</p>
                        <button
                            onClick={() => {
                                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                            }}
                            className="bg-white text-naijaGreen font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Login Again
                        </button>
                    </div>
                </div>
            );
        }
    }

    // If authenticated or on public route, show children
    return children;
};

export default AuthCheck;