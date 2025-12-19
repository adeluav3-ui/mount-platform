import React from 'react';
import { useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';

const AuthCheck = ({ children }) => {
    const { getCurrentUser, getSession } = useSupabase();
    const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                console.log('AuthCheck - Verifying authentication...', { retryCount });

                // Try to get current user
                const user = await getCurrentUser();

                if (user) {
                    console.log('✅ AuthCheck - User authenticated:', user.email);
                    setAuthStatus('authenticated');
                    return;
                }

                // Try to get session
                const session = await getSession();

                if (session) {
                    console.log('✅ AuthCheck - Session found:', session.user.email);
                    setAuthStatus('authenticated');
                    return;
                }

                // If we get here, no auth found
                console.log('❌ AuthCheck - No authentication found');
                setAuthStatus('unauthenticated');

                // If retry count is less than 3, try again in 1 second
                if (retryCount < 3) {
                    console.log(`🔄 AuthCheck - Retrying... (${retryCount + 1}/3)`);
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, 1000);
                }

            } catch (error) {
                console.error('❌ AuthCheck - Error:', error);
                setAuthStatus('unauthenticated');
            }
        };

        verifyAuth();
    }, [getCurrentUser, getSession, retryCount]);

    // Show loading while checking
    if (authStatus === 'checking') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold mb-2">Checking Authentication</h2>
                    <p className="opacity-80">Securing your session...</p>
                    {retryCount > 0 && (
                        <p className="text-sm opacity-60 mt-2">Attempt {retryCount + 1} of 3</p>
                    )}
                </div>
            </div>
        );
    }

    // If unauthenticated but in a protected route, show login prompt
    if (authStatus === 'unauthenticated') {
        const isProtectedRoute = !['/', '/login'].includes(window.location.pathname);

        if (isProtectedRoute) {
            // Redirect to login after a delay
            setTimeout(() => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 2000);

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
                        <div className="animate-pulse text-sm opacity-70">
                            Redirecting to login page...
                        </div>
                    </div>
                </div>
            );
        }
    }

    // If authenticated or on public route, show children
    return children;
};

export default AuthCheck;