// src/components/Dashboard.jsx — OPTIMIZED PERSISTENT VERSION
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import CustomerDashboard from './CustomerDashboard';
import CompanyDashboard from './company/CompanyDashboard';
import DeviceRegistration from './DeviceRegistration';
import { Navigate, useLocation } from 'react-router-dom';

export default function Dashboard() {
    const { user, supabase } = useSupabase();
    const location = useLocation();
    const [role, setRole] = useState(() => {
        // Try to get role from localStorage first
        const savedRole = localStorage.getItem('user_role');
        return savedRole || 'customer';
    });
    const [loading, setLoading] = useState(false);
    const [showDeviceCheck, setShowDeviceCheck] = useState(() => {
        // Check localStorage for device check status
        if (!user) return false;
        const deviceCheckKey = `deviceCheckShown_${user.id}`;
        return localStorage.getItem(deviceCheckKey) !== 'true';
    });

    // Memoize the role check function to prevent unnecessary re-runs
    const checkUserRole = useCallback(async () => {
        if (!user) {
            console.log('No user, defaulting to customer');
            setRole('customer');
            localStorage.setItem('user_role', 'customer');
            return;
        }

        console.log('=== DASHBOARD ROLE CHECK START ===');
        console.log('User ID:', user.id);

        setLoading(true);

        try {
            // Check profiles for admin role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                console.error('Profile error:', profileError);
            }

            if (profile?.role === 'admin') {
                console.log('✅ User is ADMIN');
                setRole('admin');
                localStorage.setItem('user_role', 'admin');
                setLoading(false);
                return;
            }

            // Check if company
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (company) {
                console.log('✅ User is COMPANY');
                setRole('company');
                localStorage.setItem('user_role', 'company');

                // Check device registration status
                const deviceCheckKey = `deviceCheckShown_${user.id}`;
                const hasBeenShown = localStorage.getItem(deviceCheckKey);

                if (hasBeenShown === 'true') {
                    console.log('Device check already shown');
                    setShowDeviceCheck(false);
                } else {
                    console.log('Device check needed');
                    setShowDeviceCheck(true);
                }
            } else {
                console.log('✅ User is CUSTOMER');
                setRole('customer');
                localStorage.setItem('user_role', 'customer');
                setShowDeviceCheck(false);
            }
        } catch (error) {
            console.error('Error checking role:', error);
            setRole('customer');
            localStorage.setItem('user_role', 'customer');
        } finally {
            setLoading(false);
            console.log('=== DASHBOARD ROLE CHECK END ===');
        }
    }, [user, supabase]);

    // Only run role check when user changes, not on every mount
    useEffect(() => {
        if (user) {
            const savedRole = localStorage.getItem('user_role');
            const savedUserId = localStorage.getItem('user_id');

            // Only check role if user changed or no saved role
            if (!savedRole || savedUserId !== user.id) {
                checkUserRole();
                localStorage.setItem('user_id', user.id);
            } else {
                console.log('Using cached role:', savedRole);
                setRole(savedRole);
                setLoading(false);
            }
        }
    }, [user, checkUserRole]);

    // Handle device check completion
    const handleDeviceCheckComplete = useCallback(() => {
        console.log('Device check marked as complete for user:', user?.id);
        if (user?.id) {
            localStorage.setItem(`deviceCheckShown_${user.id}`, 'true');
            console.log('Saved device check status for user:', user.id);
        }
        setShowDeviceCheck(false);
    }, [user]);

    // Memoize the loading state to prevent unnecessary re-renders
    const isLoading = useMemo(() => loading && !role, [loading, role]);

    // Show loading only if we're actively loading and don't have a role yet
    if (isLoading) {
        return (
            <div className="min-h-screen bg-naijaGreen flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-3xl font-bold animate-pulse">Loading...</p>
                    <p className="mt-4 text-sm">Checking user permissions...</p>
                </div>
            </div>
        );
    }

    // Redirect admins to admin dashboard
    if (role === 'admin' && location.pathname.startsWith('/dashboard')) {
        console.log('🚀 Redirecting admin to /admin');
        return <Navigate to="/admin" replace />;
    }

    console.log('Rendering dashboard for role:', role, 'at path:', location.pathname);

    // Render appropriate dashboard
    return (
        <div className="dashboard-container" key={user?.id || 'no-user'}>
            {/* Add DeviceRegistration for companies */}
            {role === 'company' && showDeviceCheck && (
                <DeviceRegistration onComplete={handleDeviceCheckComplete} />
            )}

            {/* Render the appropriate dashboard */}
            {role === 'company' ? <CompanyDashboard /> : <CustomerDashboard />}
        </div>
    );
}