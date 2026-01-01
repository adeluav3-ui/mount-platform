// src/components/Dashboard.jsx — COMPLETE FIXED VERSION
import React from 'react';
import { useSupabase } from '../context/SupabaseContext'
import CustomerDashboard from './CustomerDashboard'
import CompanyDashboard from './company/CompanyDashboard'
import DeviceRegistration from './DeviceRegistration';
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function Dashboard() {
    const { user, supabase } = useSupabase()
    const [role, setRole] = useState('customer')
    const [loading, setLoading] = useState(false)
    const [showDeviceCheck, setShowDeviceCheck] = useState(false);

    useEffect(() => {
        if (!user) {
            setRole('customer')
            return
        }

        console.log('=== DASHBOARD DEBUG START ===')
        console.log('User ID:', user.id)
        console.log('User email:', user.email)

        setLoading(true)

        // Check if we should show device check
        const shouldShowDeviceCheck = () => {
            // Check localStorage first
            const deviceCheckKey = `deviceCheckShown_${user.id}`;
            const hasBeenShown = localStorage.getItem(deviceCheckKey);

            if (hasBeenShown === 'true') {
                console.log('Device check already shown for user:', user.id);
                return false;
            }

            // Check if it's a company
            return true; // Will be refined after role check
        };

        // SIMPLE check - first check profiles for admin
        supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data: profile, error: profileError }) => {
                console.log('Profile check result:', profile)

                if (profileError) {
                    console.error('Profile error:', profileError)
                    // Continue with company check
                    return supabase
                        .from('companies')
                        .select('id')
                        .eq('id', user.id)
                        .maybeSingle()
                }

                if (profile?.role === 'admin') {
                    console.log('✅ User is ADMIN!')
                    setRole('admin')
                    setLoading(false)
                    return null // Stop here
                }

                console.log('User is not admin, checking company...')
                // Not admin, check if company
                return supabase
                    .from('companies')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle()
            })
            .then((companyData) => {
                if (companyData === null) {
                    // This means we already set admin role
                    console.log('Already set admin role, skipping company check')
                    return
                }

                console.log('Company check result:', companyData)

                if (companyData?.data) {
                    console.log('✅ User is COMPANY')
                    setRole('company')

                    // Determine if we should show device check
                    const deviceCheckKey = `deviceCheckShown_${user.id}`;
                    const hasBeenShown = localStorage.getItem(deviceCheckKey);

                    if (hasBeenShown === 'true') {
                        console.log('Device check already shown for this company');
                        setShowDeviceCheck(false);
                    } else {
                        console.log('Showing device check for company');
                        setShowDeviceCheck(true);
                    }
                } else {
                    console.log('✅ User is CUSTOMER')
                    setRole('customer')
                    setShowDeviceCheck(false);
                }
            })
            .catch((error) => {
                console.error('Error checking role:', error)
                setRole('customer') // Default fallback
            })
            .finally(() => {
                setLoading(false)
                console.log('=== DASHBOARD DEBUG END ===')
            })
    }, [user, supabase])

    console.log('Current role:', role)
    console.log('Loading:', loading)
    console.log('Show device check:', showDeviceCheck)

    // Handle device check completion
    const handleDeviceCheckComplete = () => {
        console.log('Device check marked as complete for user:', user?.id);
        if (user?.id) {
            localStorage.setItem(`deviceCheckShown_${user.id}`, 'true');
            console.log('Saved to localStorage: deviceCheckShown_' + user.id);
        }
        setShowDeviceCheck(false);
    };

    // Show loading only if we're actively loading
    if (loading) {
        return (
            <div className="min-h-screen bg-naijaGreen flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-3xl font-bold animate-pulse">Loading...</p>
                    <p className="mt-4 text-sm">Checking user permissions...</p>
                </div>
            </div>
        )
    }

    // Redirect admins ONLY if they're trying to access the dashboard
    if (role === 'admin' && window.location.pathname.startsWith('/dashboard')) {
        console.log('🚀 Redirecting to /admin from dashboard')
        return <Navigate to="/admin" replace />
    }

    console.log('Rendering dashboard for role:', role)

    // Render appropriate dashboard with DeviceRegistration for companies
    return (
        <>
            {/* Add DeviceRegistration for companies */}
            {role === 'company' && showDeviceCheck && (
                <DeviceRegistration onComplete={handleDeviceCheckComplete} />
            )}

            {/* Render the appropriate dashboard */}
            {role === 'company' ? <CompanyDashboard /> : <CustomerDashboard />}
        </>
    );
}